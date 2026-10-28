using Api.Domain;

namespace Api.Dtos;

/// <summary>
/// One Tournament as the Tournament History lists it, without its Standings.
/// </summary>
/// <param name="Id">The Tournament's id</param>
/// <param name="StartedAt">When the Tournament was started, in UTC</param>
/// <param name="RoundsPlayed">Number of Rounds processed so far, 0 to 15</param>
public record TournamentHistoryEntryDto(Guid Id, DateTimeOffset StartedAt, int RoundsPlayed)
{
    /// <summary>
    /// Copies the parts of a Tournament that the Tournament History shows.
    /// </summary>
    /// <param name="tournament">The Tournament</param>
    /// <returns>The Tournament's History entry</returns>
    public static TournamentHistoryEntryDto From(Tournament tournament) => new(
        tournament.Id,
        tournament.StartedAt,
        tournament.RoundsPlayed);
}
