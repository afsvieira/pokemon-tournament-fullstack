namespace Api.Application;

/// <summary>
/// Thrown when Process Round is asked of a Tournament whose 15 Rounds have all been played.
/// </summary>
public class TournamentCompleteException : Exception
{
    /// <summary>
    /// Creates the exception for the Complete Tournament.
    /// </summary>
    /// <param name="tournamentId">The Complete Tournament's id</param>
    public TournamentCompleteException(Guid tournamentId)
        : base($"Tournament {tournamentId} is already complete.")
    {
    }
}
