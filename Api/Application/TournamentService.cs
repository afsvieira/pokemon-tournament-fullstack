using System.Text.Json;
using Api.Domain;
using Api.Dtos;
using Api.Shared;

namespace Api.Application;

/// <summary>
/// Orchestrates both flows: the Instant Simulation (data fetching, battle simulation and result sorting)
/// and the round-by-round Tournaments it starts and keeps in the repository.
/// </summary>
public class TournamentService : ITournamentService
{
    private readonly IPokemonApiClient _pokemonApiClient;
    private readonly BattleSimulator _battleSimulator;
    private readonly ITournamentRepository _tournamentRepository;
    private readonly TimeProvider _timeProvider;

    /// <summary>
    /// Creates the service with its collaborators.
    /// </summary>
    /// <param name="pokemonApiClient">Fetches the random Pokémon from PokéAPI</param>
    /// <param name="battleSimulator">Decides each Battle with the battle rules</param>
    /// <param name="tournamentRepository">Holds the round-by-round Tournaments in memory</param>
    /// <param name="timeProvider">The clock that stamps each Tournament's start time</param>
    public TournamentService(
        IPokemonApiClient pokemonApiClient,
        BattleSimulator battleSimulator,
        ITournamentRepository tournamentRepository,
        TimeProvider timeProvider)
    {
        _pokemonApiClient = pokemonApiClient;
        _battleSimulator = battleSimulator;
        _tournamentRepository = tournamentRepository;
        _timeProvider = timeProvider;
    }

    /// <summary>
    /// Executes the full tournament process: fetches Pokémon, simulates battles,
    /// and returns sorted statistics based on the given criteria.
    /// </summary>
    /// <param name="sortBy">The field used for sorting (e.g., wins, losses, name, etc.).</param>
    /// <param name="sortDirection">The direction of sorting (asc or desc, default is asc).</param>
    /// <returns>A collection of Pokémon with calculated battle statistics.</returns>
    public async Task<IEnumerable<TournamentPokemon>> GetTournamentStatistics(string sortBy, string sortDirection = "asc")
    {
        var pokemons = await _pokemonApiClient.FetchRandomPokemonsAsync();
        
        foreach (var pokemon in pokemons)
        {
            pokemon.Name = StringHelper.Capitalize(pokemon.Name);
        }

        _battleSimulator.SimulateAllBattles(pokemons);
        return SortPokemons(pokemons, sortBy, sortDirection);
    }

    /// <summary>
    /// Starts a round-by-round Tournament: fetches 16 random Pokémon and stores the Tournament in memory.
    /// </summary>
    /// <returns>The new Tournament, with no Rounds played and every Pokémon at 0 wins, losses and ties</returns>
    /// <exception cref="PokemonUnavailableException">When PokéAPI fails or returns fewer than 16 Pokémon; nothing is stored</exception>
    public async Task<TournamentDto> StartTournament()
    {
        List<TournamentPokemon> pokemons;
        try
        {
            pokemons = await _pokemonApiClient.FetchRandomPokemonsAsync(Tournament.PokemonCount);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            // PokéAPI answered an error status, timed out or sent a body we can't read; anything else is a bug (500)
            throw new PokemonUnavailableException("PokéAPI failed while fetching a Tournament's Pokémon.", ex);
        }

        if (pokemons.Count < Tournament.PokemonCount)
            throw new PokemonUnavailableException(
                $"PokéAPI returned {pokemons.Count} of the {Tournament.PokemonCount} Pokémon a Tournament needs.");

        foreach (var pokemon in pokemons)
        {
            pokemon.Name = StringHelper.Capitalize(pokemon.Name);
        }

        var tournament = new Tournament(Guid.NewGuid(), _timeProvider.GetUtcNow(), pokemons);
        _tournamentRepository.Add(tournament);

        return TournamentDto.From(tournament);
    }

    /// <summary>
    /// Gets a round-by-round Tournament held in memory.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <returns>The Tournament with its current Standings</returns>
    /// <exception cref="TournamentNotFoundException">When no Tournament is held under that id</exception>
    public TournamentDto GetTournament(Guid id)
    {
        var tournament = GetStoredTournament(id);

        lock (tournament.SyncRoot)
        {
            return TournamentDto.From(tournament);
        }
    }

    /// <summary>
    /// Processes the next Round of a Tournament: pairs its Pokémon, decides the 8 Battles and updates the Standings.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <returns>The Round just played, with the updated Standings</returns>
    /// <exception cref="TournamentNotFoundException">When no Tournament is held under that id</exception>
    /// <exception cref="TournamentCompleteException">When all 15 Rounds have already been played</exception>
    public ProcessedRoundDto ProcessRound(Guid id)
    {
        var tournament = GetStoredTournament(id);

        // Simultaneous calls take turns: the second one plays the following Round, or finds the Tournament Complete
        lock (tournament.SyncRoot)
        {
            if (tournament.IsComplete)
                throw new TournamentCompleteException(id);

            var round = tournament.PlayNextRound(_battleSimulator);
            return ProcessedRoundDto.From(round, tournament);
        }
    }

    /// <summary>
    /// Gets a played Round of a Tournament.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <param name="roundNumber">The Round's number, 1 to 15</param>
    /// <returns>The Round with its 8 Battles</returns>
    /// <exception cref="TournamentNotFoundException">When no Tournament is held under that id</exception>
    /// <exception cref="RoundNotFoundException">When the Round is outside 1–15 or hasn't been played yet</exception>
    public RoundDto GetRound(Guid id, int roundNumber)
    {
        var tournament = GetStoredTournament(id);

        lock (tournament.SyncRoot)
        {
            if (roundNumber < 1 || roundNumber > tournament.RoundsPlayed)
                throw new RoundNotFoundException(id, roundNumber);

            return RoundDto.From(tournament.Rounds[roundNumber - 1], tournament);
        }
    }

    /// <summary>
    /// Gets a played Battle of a Tournament.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <param name="battleId">The Battle's number within the Tournament, 1 to 120</param>
    /// <returns>The Battle with both Pokémon and its winner</returns>
    /// <exception cref="TournamentNotFoundException">When no Tournament is held under that id</exception>
    /// <exception cref="BattleNotFoundException">When the Battle is outside 1–120 or hasn't been played yet</exception>
    public BattleDto GetBattle(Guid id, int battleId)
    {
        var tournament = GetStoredTournament(id);

        lock (tournament.SyncRoot)
        {
            var battle = tournament.Rounds
                .SelectMany(round => round.Battles)
                .SingleOrDefault(battle => battle.Id == battleId)
                ?? throw new BattleNotFoundException(id, battleId);

            return BattleDto.From(battle, tournament);
        }
    }

    private Tournament GetStoredTournament(Guid id)
    {
        return _tournamentRepository.Get(id) ?? throw new TournamentNotFoundException(id);
    }

    private IEnumerable<TournamentPokemon> SortPokemons(List<TournamentPokemon> pokemons, string sortBy, string direction)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
            throw new ArgumentException("sortBy parameter cannot be null or empty", nameof(sortBy));

        Func<TournamentPokemon, object> keySelector = sortBy.ToLower() switch
        {
            "wins" => p => p.Wins,
            "losses" => p => p.Losses,
            "ties" => p => p.Ties,
            "name" => p => p.Name,
            "id" => p => p.Id,
            _ => throw new ArgumentException($"Invalid sortBy value: {sortBy}", nameof(sortBy))
        };

        var sorted = direction.Equals("asc", StringComparison.OrdinalIgnoreCase)
            ? pokemons.OrderBy(keySelector)
            : pokemons.OrderByDescending(keySelector);

        return sorted.ToList();
    }


}