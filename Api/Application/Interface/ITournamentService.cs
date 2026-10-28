using Api.Domain;
using Api.Dtos;

namespace  Api.Application;

/// <summary>
/// Defines the contract for running a Pokémon tournament simulation,
/// including fetching data from the external API and returning calculated statistics.
/// </summary>
public interface ITournamentService
{
    /// <summary>
    /// Executes the tournament, simulating all battles and returning sorted results.
    /// </summary>
    /// <param name="sortBy">The field to sort results by (e.g., wins, losses, ties, name, etc.).</param>
    /// <param name="sortDirection">The sorting direction: "asc" or "desc". Defaults to ascending.</param>
    /// <returns>A collection of tournament statistics for each Pokémon.</returns>
    Task<IEnumerable<TournamentPokemon>> GetTournamentStatistics(string sortBy, string sortDirection = "asc");

    /// <summary>
    /// Starts a round-by-round Tournament: fetches 16 random Pokémon and stores the Tournament in memory.
    /// </summary>
    /// <returns>The new Tournament, with no Rounds played and every Pokémon at 0 wins, losses and ties</returns>
    /// <exception cref="PokemonUnavailableException">When PokéAPI fails or returns fewer than 16 Pokémon; nothing is stored</exception>
    Task<TournamentDto> StartTournament();

    /// <summary>
    /// Gets a round-by-round Tournament held in memory.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <returns>The Tournament with its current Standings, or null when none is held under that id</returns>
    TournamentDto? GetTournament(Guid id);
}