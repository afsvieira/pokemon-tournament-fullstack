namespace Api.Application;

/// <summary>
/// Thrown when a Round is outside 1–15 or hasn't been played yet.
/// </summary>
public class RoundNotFoundException : Exception
{
    /// <summary>
    /// Creates the exception for the missing Round.
    /// </summary>
    /// <param name="tournamentId">The Tournament's id</param>
    /// <param name="roundNumber">The Round number that wasn't found</param>
    public RoundNotFoundException(Guid tournamentId, int roundNumber)
        : base($"Tournament {tournamentId} has no played Round {roundNumber}.")
    {
    }
}
