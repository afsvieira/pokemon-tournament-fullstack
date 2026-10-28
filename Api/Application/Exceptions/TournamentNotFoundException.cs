namespace Api.Application;

/// <summary>
/// Thrown when no Tournament is held under the requested id, e.g. after an API restart or with a stale link.
/// </summary>
public class TournamentNotFoundException : Exception
{
    /// <summary>
    /// Creates the exception for the unknown id.
    /// </summary>
    /// <param name="tournamentId">The id no Tournament is held under</param>
    public TournamentNotFoundException(Guid tournamentId)
        : base($"No Tournament is held under id {tournamentId}.")
    {
    }
}
