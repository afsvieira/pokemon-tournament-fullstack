using Api.Application;
using Api.Domain;
using Api.Dtos;
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

    /// <summary>
    /// Verifies the circle-method schedule over a whole Tournament: each Round has 8 Battles in which every
    /// Pokémon fights once, and over the 15 Rounds every one of the 120 pairs meets exactly once.
    /// </summary>
    [Fact]
    public async Task ProcessRound_ShouldPairEveryPokemonOncePerRoundAndEveryPairOnce_WhenFifteenRoundsArePlayed()
    {
        // Arrange
        var tournament = await StartTournamentAsync(TestPokemon.FromIds(TestPokemon.SixteenIds));

        // Act
        var rounds = PlayRounds(tournament.Id, Tournament.RoundCount);

        // Assert
        Assert.Equal(Enumerable.Range(1, 15), rounds.Select(round => round.RoundNumber));
        Assert.All(rounds, round =>
        {
            Assert.Equal(8, round.Battles.Count);
            var fighters = round.Battles.SelectMany(battle => new[] { battle.Pokemon1.Id, battle.Pokemon2.Id });
            Assert.Equal(TestPokemon.SixteenIds.Order(), fighters.Order());
        });

        var pairs = rounds
            .SelectMany(round => round.Battles)
            .Select(battle => (Math.Min(battle.Pokemon1.Id, battle.Pokemon2.Id), Math.Max(battle.Pokemon1.Id, battle.Pokemon2.Id)));
        Assert.Equal(120, pairs.Distinct().Count());
    }

    /// <summary>
    /// Verifies that Battles are numbered 1 to 120 in play order, carry their Round's number,
    /// and put first whichever Pokémon comes first in the Start order.
    /// </summary>
    [Fact]
    public async Task ProcessRound_ShouldNumberBattlesInPlayOrderWithStartOrderSides_WhenFifteenRoundsArePlayed()
    {
        // Arrange
        var tournament = await StartTournamentAsync(TestPokemon.FromIds(TestPokemon.SixteenIds));

        // Act
        var rounds = PlayRounds(tournament.Id, Tournament.RoundCount);

        // Assert
        var battles = rounds.SelectMany(round => round.Battles).ToList();
        Assert.Equal(Enumerable.Range(1, 120), battles.Select(battle => battle.Id));
        Assert.All(rounds, round => Assert.All(round.Battles, battle => Assert.Equal(round.RoundNumber, battle.RoundNumber)));
        Assert.All(battles, battle => Assert.True(
            Array.IndexOf(TestPokemon.SixteenIds, battle.Pokemon1.Id) < Array.IndexOf(TestPokemon.SixteenIds, battle.Pokemon2.Id),
            $"Battle {battle.Id}: Pokémon {battle.Pokemon1.Id} should come before {battle.Pokemon2.Id} in Start order"));
    }

    /// <summary>
    /// Verifies that each Battle is decided by the battle rules (here, same type, so higher base experience wins,
    /// and equal base experience ties with a null winner), and that the Standings count exactly those results.
    /// </summary>
    [Fact]
    public async Task ProcessRound_ShouldKeepStandingsMatchingTheBattles_WhenOneBattleIsATie()
    {
        // Arrange - All "normal" type; the first two Pokémon share their base experience, so their Battle is a tie
        var pokemons = TestPokemon.FromIds(TestPokemon.SixteenIds);
        pokemons[1].BaseExperience = pokemons[0].BaseExperience;
        var baseExperienceById = pokemons.ToDictionary(pokemon => pokemon.Id, pokemon => pokemon.BaseExperience);
        var tournament = await StartTournamentAsync(pokemons);

        // Act
        var rounds = PlayRounds(tournament.Id, Tournament.RoundCount);

        // Assert
        var battles = rounds.SelectMany(round => round.Battles).ToList();
        var tie = Assert.Single(battles, battle => battle.WinnerId is null);
        Assert.Equal(
            new[] { TestPokemon.SixteenIds[0], TestPokemon.SixteenIds[1] },
            new[] { tie.Pokemon1.Id, tie.Pokemon2.Id });
        Assert.All(battles.Where(battle => battle.WinnerId is not null), battle => Assert.Equal(
            baseExperienceById[battle.Pokemon1.Id] > baseExperienceById[battle.Pokemon2.Id] ? battle.Pokemon1.Id : battle.Pokemon2.Id,
            battle.WinnerId));

        Assert.All(rounds[^1].Standings, entry =>
        {
            var fought = battles.Where(battle => battle.Pokemon1.Id == entry.Id || battle.Pokemon2.Id == entry.Id).ToList();
            Assert.Equal(fought.Count(battle => battle.WinnerId == entry.Id), entry.Wins);
            Assert.Equal(fought.Count(battle => battle.WinnerId is not null && battle.WinnerId != entry.Id), entry.Losses);
            Assert.Equal(fought.Count(battle => battle.WinnerId is null), entry.Ties);
        });
    }

    /// <summary>
    /// Verifies that Process Round is rejected once all 15 Rounds have been played.
    /// </summary>
    [Fact]
    public async Task ProcessRound_ShouldThrowTournamentComplete_WhenFifteenRoundsWerePlayed()
    {
        // Arrange
        var tournament = await StartTournamentAsync(TestPokemon.FromIds(TestPokemon.SixteenIds));
        PlayRounds(tournament.Id, Tournament.RoundCount);

        // Act
        var processRound = () => _service.ProcessRound(tournament.Id);

        // Assert
        Assert.Throws<TournamentCompleteException>(processRound);
    }

    /// <summary>
    /// Verifies that simultaneous Process Round calls on one Tournament run one after another:
    /// they play Rounds 1 to 15 with no number duplicated or skipped, and every Battle is registered on both sides.
    /// </summary>
    [Fact]
    public async Task ProcessRound_ShouldPlayConsecutiveRounds_WhenCalledInParallel()
    {
        // Arrange
        var tournament = await StartTournamentAsync(TestPokemon.FromIds(TestPokemon.SixteenIds));

        // Act
        var rounds = await Task.WhenAll(Enumerable.Range(0, Tournament.RoundCount)
            .Select(_ => Task.Run(() => _service.ProcessRound(tournament.Id))));

        // Assert
        Assert.Equal(Enumerable.Range(1, 15), rounds.Select(round => round.RoundNumber).Order());
        var finalTournament = _service.GetTournament(tournament.Id);
        Assert.Equal(15, finalTournament.RoundsPlayed);
        Assert.All(finalTournament.Standings, entry => Assert.Equal(15, entry.Wins + entry.Losses + entry.Ties));
    }

    /// <summary>
    /// Verifies that Process Round on a Tournament the API doesn't hold is reported as an unknown Tournament.
    /// </summary>
    [Fact]
    public void ProcessRound_ShouldThrowTournamentNotFound_WhenTournamentIsUnknown()
    {
        // Arrange
        var unknownId = Guid.NewGuid();

        // Act
        var processRound = () => _service.ProcessRound(unknownId);

        // Assert
        Assert.Throws<TournamentNotFoundException>(processRound);
    }

    /// <summary>
    /// Verifies that asking for a Round not played yet is reported as an unknown Round.
    /// </summary>
    [Fact]
    public async Task GetRound_ShouldThrowRoundNotFound_WhenRoundWasNotPlayed()
    {
        // Arrange
        var tournament = await StartTournamentAsync(TestPokemon.FromIds(TestPokemon.SixteenIds));
        PlayRounds(tournament.Id, 1);

        // Act
        var getRound = () => _service.GetRound(tournament.Id, 2);

        // Assert
        Assert.Throws<RoundNotFoundException>(getRound);
    }

    private async Task<TournamentDto> StartTournamentAsync(List<TournamentPokemon> pokemons)
    {
        ReturnFromPokeApi(pokemons);
        return await _service.StartTournament();
    }

    private List<ProcessedRoundDto> PlayRounds(Guid tournamentId, int count)
    {
        return Enumerable.Range(0, count).Select(_ => _service.ProcessRound(tournamentId)).ToList();
    }

    private void ReturnFromPokeApi(List<TournamentPokemon> pokemons)
    {
        _pokemonApiClient
            .Setup(client => client.FetchRandomPokemonsAsync(It.IsAny<int>()))
            .ReturnsAsync(pokemons);
    }
}
