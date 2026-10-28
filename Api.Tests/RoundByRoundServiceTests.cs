using Api.Application;
using Api.Domain;
using Api.Infrastructure;
using Microsoft.Extensions.Time.Testing;
using Moq;

namespace Api.Tests;

/// <summary>
/// Tests for the round-by-round Tournament operations of the TournamentService.
/// PokéAPI is replaced by a fake client and the clock by a fake time provider; everything else is real.
/// </summary>
public class RoundByRoundServiceTests
{
    private static readonly DateTimeOffset StartTime = new(2026, 10, 28, 14, 2, 0, TimeSpan.Zero);

    private readonly Mock<IPokemonApiClient> _pokemonApiClient = new();
    private readonly InMemoryTournamentRepository _repository = new();
    private readonly TournamentService _service;

    public RoundByRoundServiceTests()
    {
        _service = new TournamentService(
            _pokemonApiClient.Object, new BattleSimulator(), _repository, new FakeTimeProvider(StartTime));
    }

    /// <summary>
    /// Verifies that Start returns the 16 fetched Pokémon in Start order, capitalized and with no battles,
    /// stamped with the clock's time and with no Rounds played.
    /// </summary>
    [Fact]
    public async Task StartTournament_ShouldReturnSixteenPokemonWithNoBattles_WhenPokeApiReturnsSixteen()
    {
        // Arrange
        ReturnFromPokeApi(TestPokemon.FromIds(TestPokemon.SixteenIds));

        // Act
        var tournament = await _service.StartTournament();

        // Assert
        Assert.Equal(StartTime, tournament.StartedAt);
        Assert.Equal(0, tournament.RoundsPlayed);
        Assert.Equal(TestPokemon.SixteenIds, tournament.Standings.Select(entry => entry.Id));
        Assert.Equal("Pokemon25", tournament.Standings[0].Name);
        Assert.All(tournament.Standings, entry =>
        {
            Assert.Equal(0, entry.Wins);
            Assert.Equal(0, entry.Losses);
            Assert.Equal(0, entry.Ties);
            Assert.Equal(0, entry.WinRate);
        });
    }

    /// <summary>
    /// Verifies that Start fails when PokéAPI returns fewer than 16 Pokémon, and that no Tournament is stored.
    /// </summary>
    [Fact]
    public async Task StartTournament_ShouldFailAndStoreNothing_WhenPokeApiReturnsFewerThanSixteen()
    {
        // Arrange
        ReturnFromPokeApi(TestPokemon.FromIds(TestPokemon.SixteenIds.Take(15)));

        // Act
        var startTournament = () => _service.StartTournament();

        // Assert
        await Assert.ThrowsAsync<PokemonUnavailableException>(startTournament);
        Assert.Empty(_repository.GetAll());
    }

    /// <summary>
    /// Verifies that asking for a Tournament the API doesn't hold is reported as an unknown Tournament.
    /// </summary>
    [Fact]
    public void GetTournament_ShouldThrowTournamentNotFound_WhenTournamentIsUnknown()
    {
        // Arrange
        var unknownId = Guid.NewGuid();

        // Act
        var getTournament = () => _service.GetTournament(unknownId);

        // Assert
        Assert.Throws<TournamentNotFoundException>(getTournament);
    }

    private void ReturnFromPokeApi(List<TournamentPokemon> pokemons)
    {
        _pokemonApiClient
            .Setup(client => client.FetchRandomPokemonsAsync(It.IsAny<int>()))
            .ReturnsAsync(pokemons);
    }
}
