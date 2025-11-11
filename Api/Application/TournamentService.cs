using Api.Domain;
using Api.Infrastructure;
using Api.Shared;

namespace Api.Application;

/// <summary>
/// Orchestrates Pokémon tournament workflow: data fetching, battle simulation, and result sorting.
/// </summary>
public class TournamentService : ITournamentService
{
    private readonly PokemonApiClient _pokemonApiClient;
    private readonly BattleSimulator _battleSimulator;

    public TournamentService(PokemonApiClient pokemonApiClient, BattleSimulator battleSimulator)
    {
        _pokemonApiClient = pokemonApiClient;
        _battleSimulator = battleSimulator;
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