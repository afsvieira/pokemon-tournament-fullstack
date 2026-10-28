using System.Net;
using Api.Application;
using Api.Domain;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace Api.Tests;

/// <summary>
/// Tests for the tournament rate limiting policy, exercised through the real HTTP pipeline.
/// PokéAPI is replaced by a fake client so the tests never touch the network.
/// </summary>
public class RateLimitingTests
{
    private const string StatisticsUrl = "/pokemon/tournament/statistics?sortBy=wins";

    // Mirrors the TournamentPolicy configuration in Program.cs
    private const int PermitLimit = 10;
    private const int QueueLimit = 5;

    /// <summary>
    /// Verifies that a request rejected by the rate limiter returns 429 Too Many Requests.
    /// Of PermitLimit + QueueLimit + 1 concurrent requests, PermitLimit are processed,
    /// QueueLimit wait for the next window and the last one is rejected.
    /// </summary>
    [Fact]
    public async Task Statistics_ShouldReturn429_WhenRateLimitIsExceeded()
    {
        // Arrange - Fresh app per test so the limiter starts with a full window
        await using var factory = CreateFactoryWithFakePokemonApi();
        var client = factory.CreateClient();
        using var cancellation = new CancellationTokenSource();
        var timeout = Task.Delay(TimeSpan.FromSeconds(10));

        // Act - Send every request at once and collect responses until one beyond the queue is answered
        var pending = Enumerable.Range(0, PermitLimit + QueueLimit + 1)
            .Select(_ => client.GetAsync(StatisticsUrl, cancellation.Token))
            .ToList();

        var statuses = new List<HttpStatusCode>();
        while (statuses.Count < PermitLimit + 1)
        {
            var completed = await Task.WhenAny(pending.Cast<Task>().Append(timeout));
            Assert.False(completed == timeout,
                $"Expected one request to be rejected, but only these responses arrived: [{string.Join(", ", statuses)}]");

            var request = (Task<HttpResponseMessage>)completed;
            pending.Remove(request);
            using var response = await request;
            statuses.Add(response.StatusCode);
        }

        // Release the queued requests instead of waiting a full window for them
        cancellation.Cancel();

        // Assert - PermitLimit requests served, the one beyond the queue rejected with 429
        Assert.Equal(PermitLimit, statuses.Count(status => status == HttpStatusCode.OK));
        Assert.Contains(HttpStatusCode.TooManyRequests, statuses);
    }

    private static WebApplicationFactory<Program> CreateFactoryWithFakePokemonApi()
    {
        var pokemonApiClient = new Mock<IPokemonApiClient>();
        pokemonApiClient
            .Setup(client => client.FetchRandomPokemonsAsync(It.IsAny<int>()))
            .ReturnsAsync(() => new List<TournamentPokemon>
            {
                new() { Id = 4, Name = "charmander", Type = "fire", BaseExperience = 62 },
                new() { Id = 7, Name = "squirtle", Type = "water", BaseExperience = 63 }
            });

        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services.AddSingleton(pokemonApiClient.Object)));
    }
}
