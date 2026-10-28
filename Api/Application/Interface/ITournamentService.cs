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
    /// <returns>The Tournament with its current Standings</returns>
    /// <exception cref="TournamentNotFoundException">When no Tournament is held under that id</exception>
    TournamentDto GetTournament(Guid id);

    /// <summary>
    /// Processes the next Round of a Tournament: pairs its Pokémon, decides the 8 Battles and updates the Standings.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <returns>The Round just played, with the updated Standings</returns>
    /// <exception cref="TournamentNotFoundException">When no Tournament is held under that id</exception>
    /// <exception cref="TournamentCompleteException">When all 15 Rounds have already been played</exception>
    ProcessedRoundDto ProcessRound(Guid id);

    /// <summary>
    /// Gets a played Round of a Tournament.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <param name="roundNumber">The Round's number, 1 to 15</param>
    /// <returns>The Round with its 8 Battles</returns>
    /// <exception cref="TournamentNotFoundException">When no Tournament is held under that id</exception>
    /// <exception cref="RoundNotFoundException">When the Round is outside 1–15 or hasn't been played yet</exception>
    RoundDto GetRound(Guid id, int roundNumber);

    /// <summary>
    /// Gets a played Battle of a Tournament.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <param name="battleId">The Battle's number within the Tournament, 1 to 120</param>
    /// <returns>The Battle with both Pokémon and its winner</returns>
    /// <exception cref="TournamentNotFoundException">When no Tournament is held under that id</exception>
    /// <exception cref="BattleNotFoundException">When the Battle is outside 1–120 or hasn't been played yet</exception>
    BattleDto GetBattle(Guid id, int battleId);

    /// <summary>
    /// Lists the Tournament History: every Tournament started since the API last started.
    /// </summary>
    /// <returns>Every Tournament, newest first, Complete or not</returns>
    IReadOnlyList<TournamentHistoryEntryDto> GetHistory();
}