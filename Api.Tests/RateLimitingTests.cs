using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace Api.Tests;

/// <summary>
/// Tests for the rate-limit policies and their configuration, exercised through the real HTTP pipeline.
/// PokéAPI is replaced by a fake client so the tests never touch the network.
/// </summary>
public class RateLimitingTests
{
    private const string StatisticsUrl = "/pokemon/tournament/statistics?sortBy=wins";
    private const string TournamentPolicySection = "RateLimiting:TournamentPolicy";

    // Mirror RateLimiting:TournamentPolicy in Api/appsettings.json
    private const int PermitLimit = 10;
    private const int QueueLimit = 5;

    // Mirror RateLimiting:StartTournamentPolicy and RateLimiting:RoundByRoundPolicy, which have no queue
    private const int StartTournamentPermitLimit = 10;
    private const int RoundByRoundPermitLimit = 60;

    /// <summary>
    /// Verifies that a request rejected by the rate limiter returns 429 Too Many Requests.
    /// Of PermitLimit + QueueLimit + 1 concurrent requests, PermitLimit are processed,
    /// QueueLimit wait for the next window and the last one is rejected.
    /// </summary>
    [Fact]
    public async Task Statistics_ShouldReturn429_WhenRateLimitIsExceeded()
    {
        // Arrange - Fresh app per test so the limiter starts with a full window
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();

        // Act
        var statuses = await SpendStatisticsLimitAsync(client);

        // Assert - PermitLimit requests served, the one beyond the queue rejected with 429
        Assert.Equal(PermitLimit, statuses.Count(status => status == HttpStatusCode.OK));
        Assert.Contains(HttpStatusCode.TooManyRequests, statuses);
    }

    /// <summary>
    /// Verifies that spending the Instant Simulation's limit, queue included, leaves Start and the
    /// round-by-round reads answering, since each policy has its own counters.
    /// </summary>
    [Fact]
    public async Task RoundByRoundEndpoints_ShouldStillAnswer_WhenInstantSimulationLimitIsExceeded()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();
        var statisticsStatuses = await SpendStatisticsLimitAsync(client);

        // Act
        using var startResponse = await client.PostAsync(TestApi.TournamentUrl, content: null);
        using var tournamentResponse = await client.GetAsync(startResponse.Headers.Location);

        // Assert
        Assert.Contains(HttpStatusCode.TooManyRequests, statisticsStatuses);
        Assert.Equal(HttpStatusCode.Created, startResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, tournamentResponse.StatusCode);
    }

    /// <summary>
    /// Verifies that Start answers 429 as soon as its permits are spent, without a queue,
    /// while the Instant Simulation and the round-by-round reads, which have their own counters, still answer.
    /// </summary>
    [Fact]
    public async Task StartTournament_ShouldReturn429WithoutSpendingOtherLimits_WhenItsLimitIsExceeded()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();
        using var firstStartResponse = await client.PostAsync(TestApi.TournamentUrl, content: null);
        var otherStartStatuses = await SendSequentiallyAsync(
            StartTournamentPermitLimit - 1, () => client.PostAsync(TestApi.TournamentUrl, content: null));

        // Act
        using var rejectedResponse = await client.PostAsync(TestApi.TournamentUrl, content: null);
        using var statisticsResponse = await client.GetAsync(StatisticsUrl);
        using var tournamentResponse = await client.GetAsync(firstStartResponse.Headers.Location);

        // Assert
        Assert.Equal(HttpStatusCode.Created, firstStartResponse.StatusCode);
        Assert.All(otherStartStatuses, status => Assert.Equal(HttpStatusCode.Created, status));
        Assert.Equal(HttpStatusCode.TooManyRequests, rejectedResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, statisticsResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, tournamentResponse.StatusCode);
    }

    /// <summary>
    /// Verifies that the round-by-round reads answer 429 as soon as their permits are spent, without a queue,
    /// while Start and the Instant Simulation, which have their own counters, still answer.
    /// </summary>
    [Fact]
    public async Task GetTournament_ShouldReturn429WithoutSpendingOtherLimits_WhenItsLimitIsExceeded()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();
        using var startResponse = await client.PostAsync(TestApi.TournamentUrl, content: null);
        var tournamentUrl = startResponse.Headers.Location;
        var readStatuses = await SendSequentiallyAsync(RoundByRoundPermitLimit, () => client.GetAsync(tournamentUrl));

        // Act
        using var rejectedResponse = await client.GetAsync(tournamentUrl);
        using var statisticsResponse = await client.GetAsync(StatisticsUrl);
        using var anotherStartResponse = await client.PostAsync(TestApi.TournamentUrl, content: null);

        // Assert
        Assert.All(readStatuses, status => Assert.Equal(HttpStatusCode.OK, status));
        Assert.Equal(HttpStatusCode.TooManyRequests, rejectedResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, statisticsResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, anotherStartResponse.StatusCode);
    }

    /// <summary>
    /// Verifies that the API refuses to start when the TournamentPolicy section, or one of its keys, is missing
    /// from configuration, with an error that names the section instead of falling back to defaults.
    /// </summary>
    [Theory]
    [InlineData(TournamentPolicySection)]
    [InlineData($"{TournamentPolicySection}:QueueLimit")]
    public async Task Startup_ShouldFail_WhenTournamentPolicySettingIsMissing(string missingPath)
    {
        // Arrange
        await using var factory = CreateFactoryWithoutConfigurationSection(missingPath);

        // Act
        var exception = Record.Exception(() => factory.CreateClient());

        // Assert
        var validationException = Assert.IsType<OptionsValidationException>(exception);
        Assert.Contains(TournamentPolicySection, validationException.Message);
    }

    /// <summary>
    /// Verifies that the API refuses to start when a TournamentPolicy value is out of range,
    /// with an error that names the section.
    /// </summary>
    [Theory]
    [InlineData("PermitLimit", "0")]
    [InlineData("WindowSeconds", "0")]
    [InlineData("QueueLimit", "-1")]
    public async Task Startup_ShouldFail_WhenTournamentPolicyValueIsInvalid(string key, string value)
    {
        // Arrange
        await using var factory = CreateFactoryWithConfigurationSetting($"{TournamentPolicySection}:{key}", value);

        // Act
        var exception = Record.Exception(() => factory.CreateClient());

        // Assert
        var validationException = Assert.IsType<OptionsValidationException>(exception);
        Assert.Contains(TournamentPolicySection, validationException.Message);
    }

    /// <summary>
    /// Sends PermitLimit + QueueLimit + 1 statistics requests at once and collects responses until the one beyond
    /// the queue is rejected. The queued requests are then cancelled instead of waiting a full window for them.
    /// </summary>
    private static async Task<List<HttpStatusCode>> SpendStatisticsLimitAsync(HttpClient client)
    {
        using var cancellation = new CancellationTokenSource();
        var timeout = Task.Delay(TimeSpan.FromSeconds(10));

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

        cancellation.Cancel();
        return statuses;
    }

    private static async Task<List<HttpStatusCode>> SendSequentiallyAsync(
        int count, Func<Task<HttpResponseMessage>> sendRequest)
    {
        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < count; i++)
        {
            using var response = await sendRequest();
            statuses.Add(response.StatusCode);
        }

        return statuses;
    }

    private static WebApplicationFactory<Program> CreateFactoryWithoutConfigurationSection(string sectionPath)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration((_, config) =>
            {
                // Configuration providers can't delete keys, so swap every source for a copy without the section
                var settings = config.Build().AsEnumerable()
                    .Where(setting => setting.Key != sectionPath && !setting.Key.StartsWith($"{sectionPath}:"))
                    .ToList();
                config.Sources.Clear();
                config.AddInMemoryCollection(settings);
            }));
    }

    private static WebApplicationFactory<Program> CreateFactoryWithConfigurationSetting(string key, string value)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?> { [key] = value })));
    }
}
