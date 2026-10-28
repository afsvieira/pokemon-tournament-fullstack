namespace Api.Application;

/// <summary>
/// Thrown when a Battle is outside 1–120 or hasn't been played yet.
/// </summary>
public class BattleNotFoundException : Exception
{
    /// <summary>
    /// Creates the exception for the missing Battle.
    /// </summary>
    /// <param name="tournamentId">The Tournament's id</param>
    /// <param name="battleId">The Battle id that wasn't found</param>
    public BattleNotFoundException(Guid tournamentId, int battleId)
        : base($"Tournament {tournamentId} has no played Battle {battleId}.")
    {
    }
}
