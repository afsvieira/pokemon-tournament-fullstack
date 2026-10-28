using Api.Application;
using Api.Domain;
using Api.Infrastructure;
using Moq;

namespace Api.Tests;

/// <summary>
/// Tests for input validation and error handling in the TournamentService.
/// PokéAPI is replaced by a fake client so the tests never touch the network.
/// </summary>
public class ValidationTests
{
    private readonly TournamentService _service;

    public ValidationTests()
    {
        var pokemonApiClient = new Mock<IPokemonApiClient>();
        pokemonApiClient
            .Setup(client => client.FetchRandomPokemonsAsync(It.IsAny<int>()))
            .ReturnsAsync(() => new List<TournamentPokemon>
            {
                new() { Id = 4, Name = "charmander", Type = "fire", BaseExperience = 62 },
                new() { Id = 7, Name = "squirtle", Type = "water", BaseExperience = 63 }
            });

        _service = new TournamentService(
            pokemonApiClient.Object, new BattleSimulator(), new InMemoryTournamentRepository(), TimeProvider.System);
    }

    /// <summary>
    /// Verifies that a missing sortBy parameter is rejected with ArgumentException.
    /// </summary>
    /// <param name="missingSortBy">Null, empty or whitespace-only sortBy value</param>
    [Theory]
    [InlineData(null)]      // Null
    [InlineData("")]        // Empty string
    [InlineData("   ")]     // Whitespace only
    public async Task GetTournamentStatistics_ShouldThrowArgumentException_WhenSortByIsMissing(string? missingSortBy)
    {
        // Act & Assert - Verify that missing input throws ArgumentException
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.GetTournamentStatistics(missingSortBy!, "asc"));
    }

    /// <summary>
    /// Verifies that unknown sortBy field names are rejected.
    /// </summary>
    [Fact]
    public async Task GetTournamentStatistics_ShouldThrowArgumentException_WhenSortByIsUnknown()
    {
        // Act & Assert - Verify unknown field throws ArgumentException
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.GetTournamentStatistics("unknown", "asc"));
    }
}
