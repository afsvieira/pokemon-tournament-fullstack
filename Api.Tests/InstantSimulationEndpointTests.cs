using System.Net;
using System.Text.Json;

namespace Api.Tests;

/// <summary>
/// Contract tests for the Instant Simulation endpoint, exercised through the real HTTP pipeline.
/// Existing customers rely on this contract, so these tests pin the shape the endpoint answered with
/// before the round-by-round Tournament, the PokéAPI cache and the configurable rate limits were added.
/// PokéAPI is replaced by a fake client so the tests never touch the network.
/// </summary>
public class InstantSimulationEndpointTests
{
    private const string StatisticsUrl = "/pokemon/tournament/statistics";

    private static readonly string[] PokemonProperties =
        ["id", "name", "type", "baseExperience", "imageUrl", "wins", "losses", "ties", "winRate", "battleRecords"];

    private static readonly string[] BattleRecordProperties = ["opponentName", "opponentType", "result"];

    /// <summary>
    /// Verifies that the statistics endpoint answers 200 with the 16 Pokémon in the requested order, each in the
    /// camelCase shape with its 15 battle records and string outcomes, capitalized and with the sort applied.
    /// </summary>
    [Fact]
    public async Task GetStatistics_ShouldReturn200WithSixteenPokemonAndTheirBattleRecords_WhenSortedByWinsDescending()
    {
        // Arrange - Same type for all, so the higher base experience (50 + id) wins every Battle
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();

        // Act
        using var response = await client.GetAsync($"{StatisticsUrl}?sortBy=wins&sortDirection=desc");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var pokemons = document.RootElement.EnumerateArray().ToList();

        Assert.Equal(16, pokemons.Count);
        Assert.All(pokemons, pokemon => Assert.Equal(PokemonProperties, PropertyNames(pokemon)));
        Assert.Equal(TestPokemon.SixteenIds.OrderDescending(), pokemons.Select(pokemon => pokemon.GetProperty("id").GetInt32()));
        Assert.Equal(Enumerable.Range(0, 16).Reverse(), pokemons.Select(pokemon => pokemon.GetProperty("wins").GetInt32()));
        Assert.Equal("Pokemon150", pokemons[0].GetProperty("name").GetString());
        Assert.Equal(100, pokemons[0].GetProperty("winRate").GetDouble());

        Assert.All(pokemons, pokemon =>
        {
            var records = pokemon.GetProperty("battleRecords").EnumerateArray().ToList();
            Assert.Equal(15, records.Count);
            Assert.All(records, record => Assert.Equal(BattleRecordProperties, PropertyNames(record)));
            Assert.All(records, record => Assert.Contains(record.GetProperty("result").GetString(), new[] { "Win", "Loss", "Tie" }));
        });
    }

    /// <summary>
    /// Verifies that a missing sortBy answers 400 with the error message clients already parse.
    /// </summary>
    [Fact]
    public async Task GetStatistics_ShouldReturn400WithError_WhenSortByIsMissing()
    {
        // Arrange
        await using var factory = TestApi.CreateWithSixteenPokemon();
        var client = factory.CreateClient();

        // Act
        using var response = await client.GetAsync(StatisticsUrl);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("""{"error":"sortBy parameter is required"}""", await response.Content.ReadAsStringAsync());
    }

    private static IEnumerable<string> PropertyNames(JsonElement element)
    {
        return element.EnumerateObject().Select(property => property.Name);
    }
}
