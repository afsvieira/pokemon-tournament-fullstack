using Api.Domain;

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
}