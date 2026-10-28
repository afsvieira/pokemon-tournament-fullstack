using Api.Domain;

namespace Api.Application;

/// <summary>
/// Defines the contract for fetching Pokémon data from the external PokéAPI.
/// </summary>
public interface IPokemonApiClient
{
    /// <summary>
    /// Fetches a random selection of unique Pokémon.
    /// </summary>
    /// <param name="count">Number of unique Pokémon to fetch</param>
    /// <returns>New Pokémon objects with basic attributes, safe for the caller to change</returns>
    Task<List<TournamentPokemon>> FetchRandomPokemonsAsync(int count = 16);
}
