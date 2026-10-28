using System.Net;
using System.Text.Json;
using Api.Application;
using Api.Domain;
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

    private static readonly string[] ProcessedRoundProperties = ["roundNumber", "battles", "standings"];

    private static readonly string[] BattleProperties = ["id", "roundNumber", "pokemon1", "pokemon2", "winnerId"];

    private static readonly string[] BattlePokemonProperties = ["id", "name", "type", "baseExperience", "imageUrl"];

    private static readonly string[] HistoryEntryProperties = ["id", "startedAt", "roundsPlayed"];

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

    /// <summary>
    /// Verifies that a well-formed id the API doesn't hold answers 404 with a generic error.
    /// </summary>
    [Fact]
    public async Task GetTournament_ShouldReturn404WithError_WhenTournamentIsUnknown()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();

        // Act
        using var response = await client.GetAsync($"{TestApi.TournamentUrl}/{Guid.NewGuid()}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("""{"error":"Tournament not found."}""", await response.Content.ReadAsStringAsync());
    }

    /// <summary>
    /// Verifies that an id that isn't a Guid matches no route, so it answers 404 with an empty body.
    /// </summary>
    [Fact]
    public async Task GetTournament_ShouldReturn404WithEmptyBody_WhenIdIsMalformed()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();

        // Act
        using var response = await client.GetAsync($"{TestApi.TournamentUrl}/not-a-guid");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Empty(await response.Content.ReadAsStringAsync());
    }

    /// <summary>
    /// Verifies that Process Round answers 201 with a Location pointing at the new Round, and a body with the Round's
    /// 8 Battles and the 16 Standings entries; with every Pokémon alike, each Battle is a tie with a null winner.
    /// </summary>
    [Fact]
    public async Task ProcessRound_ShouldReturn201WithLocationAndRound_WhenTournamentIsNotComplete()
    {
        // Arrange - Same type and base experience for all, so every Battle ties
        var pokemonApiClient = new Mock<IPokemonApiClient>();
        pokemonApiClient
            .Setup(client => client.FetchRandomPokemonsAsync(It.IsAny<int>()))
            .ReturnsAsync(() => TestPokemon.FromIds(TestPokemon.SixteenIds)
                .Select(pokemon => { pokemon.BaseExperience = 100; return pokemon; })
                .ToList());
        await using var factory = TestApi.Create(pokemonApiClient.Object);
        var client = factory.CreateClient();
        var tournamentUrl = await StartTournamentAsync(client);

        // Act
        using var response = await client.PostAsync($"{tournamentUrl}/rounds", content: null);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal($"{tournamentUrl}/rounds/1", response.Headers.Location?.OriginalString);

        var round = await ReadJsonAsync(response);
        Assert.Equal(ProcessedRoundProperties, PropertyNames(round));
        Assert.Equal(1, round.GetProperty("roundNumber").GetInt32());

        var standings = round.GetProperty("standings").EnumerateArray().ToList();
        Assert.Equal(TestPokemon.SixteenIds, standings.Select(entry => entry.GetProperty("id").GetInt32()));
        Assert.All(standings, entry => Assert.Equal(StandingsEntryProperties, PropertyNames(entry)));

        var battles = round.GetProperty("battles").EnumerateArray().ToList();
        Assert.Equal(Enumerable.Range(1, 8), battles.Select(battle => battle.GetProperty("id").GetInt32()));
        Assert.All(battles, battle =>
        {
            Assert.Equal(BattleProperties, PropertyNames(battle));
            Assert.Equal(BattlePokemonProperties, PropertyNames(battle.GetProperty("pokemon1")));
            Assert.Equal(BattlePokemonProperties, PropertyNames(battle.GetProperty("pokemon2")));
            Assert.Equal(JsonValueKind.Null, battle.GetProperty("winnerId").ValueKind);
        });
    }

    /// <summary>
    /// Verifies that Process Round on a Complete Tournament answers 409 with a generic error.
    /// </summary>
    [Fact]
    public async Task ProcessRound_ShouldReturn409WithError_WhenTournamentIsComplete()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();
        var tournamentUrl = await StartTournamentAsync(client);
        for (var round = 1; round <= Tournament.RoundCount; round++)
        {
            using var roundResponse = await client.PostAsync($"{tournamentUrl}/rounds", content: null);
        }

        // Act
        using var response = await client.PostAsync($"{tournamentUrl}/rounds", content: null);

        // Assert
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("""{"error":"Tournament is already complete."}""", await response.Content.ReadAsStringAsync());
    }

    /// <summary>
    /// Verifies that Process Round on a Tournament the API doesn't hold answers 404 with a generic error.
    /// </summary>
    [Fact]
    public async Task ProcessRound_ShouldReturn404WithError_WhenTournamentIsUnknown()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();

        // Act
        using var response = await client.PostAsync($"{TestApi.TournamentUrl}/{Guid.NewGuid()}/rounds", content: null);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("""{"error":"Tournament not found."}""", await response.Content.ReadAsStringAsync());
    }

    /// <summary>
    /// Verifies that the Location returned by Process Round answers 200 with that Round's number and Battles.
    /// </summary>
    [Fact]
    public async Task GetRound_ShouldReturn200WithTheRound_WhenItWasPlayed()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();
        var tournamentUrl = await StartTournamentAsync(client);
        using var processResponse = await client.PostAsync($"{tournamentUrl}/rounds", content: null);
        var processedRound = await ReadJsonAsync(processResponse);

        // Act
        using var response = await client.GetAsync(processResponse.Headers.Location);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var round = await ReadJsonAsync(response);
        Assert.Equal(["roundNumber", "battles"], PropertyNames(round));
        Assert.Equal(1, round.GetProperty("roundNumber").GetInt32());
        Assert.Equal(processedRound.GetProperty("battles").GetRawText(), round.GetProperty("battles").GetRawText());
    }

    /// <summary>
    /// Verifies that a Round outside 1–15, or not played yet, answers 404 with a generic error.
    /// </summary>
    /// <param name="roundNumber">A Round number with no played Round behind it, once Round 1 is played</param>
    [Theory]
    [InlineData(0)]
    [InlineData(2)]
    [InlineData(16)]
    public async Task GetRound_ShouldReturn404WithError_WhenRoundWasNotPlayed(int roundNumber)
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();
        var tournamentUrl = await StartTournamentAsync(client);
        using var processResponse = await client.PostAsync($"{tournamentUrl}/rounds", content: null);

        // Act
        using var response = await client.GetAsync($"{tournamentUrl}/rounds/{roundNumber}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("""{"error":"Round not found."}""", await response.Content.ReadAsStringAsync());
    }

    /// <summary>
    /// Verifies that asking for a Round of a Tournament the API doesn't hold answers 404 "Tournament not found.",
    /// not "Round not found.".
    /// </summary>
    [Fact]
    public async Task GetRound_ShouldReturn404WithTournamentError_WhenTournamentIsUnknown()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();

        // Act
        using var response = await client.GetAsync($"{TestApi.TournamentUrl}/{Guid.NewGuid()}/rounds/1");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("""{"error":"Tournament not found."}""", await response.Content.ReadAsStringAsync());
    }

    /// <summary>
    /// Verifies that a played Battle answers 200 with the Battle's camelCase shape,
    /// the same Battle that Process Round returned.
    /// </summary>
    [Fact]
    public async Task GetBattle_ShouldReturn200WithTheBattle_WhenItWasPlayed()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();
        var tournamentUrl = await StartTournamentAsync(client);
        using var processResponse = await client.PostAsync($"{tournamentUrl}/rounds", content: null);
        var processedRound = await ReadJsonAsync(processResponse);

        // Act
        using var response = await client.GetAsync($"{tournamentUrl}/battles/3");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var battle = await ReadJsonAsync(response);
        Assert.Equal(BattleProperties, PropertyNames(battle));
        Assert.Equal(3, battle.GetProperty("id").GetInt32());
        Assert.Equal(processedRound.GetProperty("battles")[2].GetRawText(), battle.GetRawText());
    }

    /// <summary>
    /// Verifies that a Battle outside 1–120, or not played yet, answers 404 with a generic error.
    /// </summary>
    /// <param name="battleId">A Battle id with no played Battle behind it, once Round 1 (Battles 1–8) is played</param>
    [Theory]
    [InlineData(0)]
    [InlineData(9)]
    [InlineData(121)]
    public async Task GetBattle_ShouldReturn404WithError_WhenBattleWasNotPlayed(int battleId)
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();
        var tournamentUrl = await StartTournamentAsync(client);
        using var processResponse = await client.PostAsync($"{tournamentUrl}/rounds", content: null);

        // Act
        using var response = await client.GetAsync($"{tournamentUrl}/battles/{battleId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("""{"error":"Battle not found."}""", await response.Content.ReadAsStringAsync());
    }

    /// <summary>
    /// Verifies that asking for a Battle of a Tournament the API doesn't hold answers 404 "Tournament not found.",
    /// not "Battle not found.".
    /// </summary>
    [Fact]
    public async Task GetBattle_ShouldReturn404WithTournamentError_WhenTournamentIsUnknown()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();

        // Act
        using var response = await client.GetAsync($"{TestApi.TournamentUrl}/{Guid.NewGuid()}/battles/1");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("""{"error":"Tournament not found."}""", await response.Content.ReadAsStringAsync());
    }

    /// <summary>
    /// Verifies that the History route answers 200 with every started Tournament as a camelCase entry,
    /// Complete or not, rather than being captured by the {id} route as a 404.
    /// </summary>
    [Fact]
    public async Task GetHistory_ShouldReturn200WithEveryTournament_WhenTournamentsWereStarted()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();
        var playedUrl = await StartTournamentAsync(client);
        using var processResponse = await client.PostAsync($"{playedUrl}/rounds", content: null);
        var unplayedUrl = await StartTournamentAsync(client);

        // Act
        using var response = await client.GetAsync($"{TestApi.TournamentUrl}/history");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var entries = (await ReadJsonAsync(response)).EnumerateArray().ToList();
        Assert.All(entries, entry => Assert.Equal(HistoryEntryProperties, PropertyNames(entry)));
        (string Url, int RoundsPlayed)[] expected = [(playedUrl, 1), (unplayedUrl, 0)];
        var listed = entries.Select(entry => (
            Url: $"{TestApi.TournamentUrl}/{entry.GetProperty("id").GetGuid()}",
            RoundsPlayed: entry.GetProperty("roundsPlayed").GetInt32()));
        Assert.Equal(expected.OrderBy(entry => entry.Url), listed.OrderBy(entry => entry.Url));
    }

    private static async Task<string> StartTournamentAsync(HttpClient client)
    {
        using var response = await client.PostAsync(TestApi.TournamentUrl, content: null);
        return response.Headers.Location!.OriginalString;
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
