using System.Net;
using System.Text.Json;
using Api.Application;
using Moq;

namespace Api.Tests;

/// <summary>
/// Tests for the round-by-round Tournament endpoints, exercised through the real HTTP pipeline.
/// PokéAPI is replaced by a fake client so the tests never touch the network.
/// </summary>
public class RoundByRoundEndpointsTests
{
    private static readonly string[] TournamentProperties = ["id", "startedAt", "roundsPlayed", "standings"];

    private static readonly string[] StandingsEntryProperties =
        ["id", "name", "type", "baseExperience", "imageUrl", "wins", "losses", "ties", "winRate"];

    /// <summary>
    /// Verifies that Start answers 201 with a Location pointing at the new Tournament, and a body with the
    /// Tournament's camelCase shape: 16 capitalized Standings entries in Start order, without battle records.
    /// </summary>
    [Fact]
    public async Task StartTournament_ShouldReturn201WithLocationAndTournament_WhenPokeApiReturnsSixteen()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();

        // Act
        using var response = await client.PostAsync(TestApi.TournamentUrl, content: null);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var tournament = await ReadJsonAsync(response);
        Assert.Equal(TournamentProperties, PropertyNames(tournament));
        Assert.Equal($"{TestApi.TournamentUrl}/{tournament.GetProperty("id").GetGuid()}", response.Headers.Location?.OriginalString);
        Assert.Equal(TimeSpan.Zero, tournament.GetProperty("startedAt").GetDateTimeOffset().Offset);
        Assert.Equal(0, tournament.GetProperty("roundsPlayed").GetInt32());

        var standings = tournament.GetProperty("standings").EnumerateArray().ToList();
        Assert.Equal(TestPokemon.SixteenIds, standings.Select(entry => entry.GetProperty("id").GetInt32()));
        Assert.All(standings, entry => Assert.Equal(StandingsEntryProperties, PropertyNames(entry)));
        Assert.Equal("Pokemon25", standings[0].GetProperty("name").GetString());
    }

    /// <summary>
    /// Verifies that the Location returned by Start answers 200 with the same Tournament.
    /// </summary>
    [Fact]
    public async Task GetTournament_ShouldReturn200WithTheTournament_WhenItWasStarted()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();
        using var startResponse = await client.PostAsync(TestApi.TournamentUrl, content: null);
        var startedTournament = await startResponse.Content.ReadAsStringAsync();

        // Act
        using var response = await client.GetAsync(startResponse.Headers.Location);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(startedTournament, await response.Content.ReadAsStringAsync());
    }

    /// <summary>
    /// Verifies that Start answers 502 with a generic error, and no upstream details, when PokéAPI fails.
    /// </summary>
    [Fact]
    public async Task StartTournament_ShouldReturn502WithGenericError_WhenPokeApiFails()
    {
        // Arrange
        var pokemonApiClient = new Mock<IPokemonApiClient>();
        pokemonApiClient
            .Setup(client => client.FetchRandomPokemonsAsync(It.IsAny<int>()))
            .ThrowsAsync(new HttpRequestException("PokéAPI answered 503 Service Unavailable"));
        await using var factory = TestApi.Create(pokemonApiClient.Object);
        var client = factory.CreateClient();

        // Act
        using var response = await client.PostAsync(TestApi.TournamentUrl, content: null);

        // Assert
        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
        Assert.Equal(
            """{"error":"Could not start a tournament right now. Try again later."}""",
            await response.Content.ReadAsStringAsync());
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response)
    {
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return document.RootElement.Clone();
    }

    private static IEnumerable<string> PropertyNames(JsonElement element)
    {
        return element.EnumerateObject().Select(property => property.Name);
    }
}
