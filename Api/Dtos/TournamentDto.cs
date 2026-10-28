using Api.Domain;

namespace Api.Dtos;

/// <summary>
/// A Tournament as the round-by-round endpoints return it.
/// </summary>
/// <param name="Id">The Tournament's id</param>
/// <param name="StartedAt">When the Tournament was started, in UTC</param>
/// <param name="RoundsPlayed">Number of Rounds processed so far, 0 to 15</param>
/// <param name="Standings">The 16 Pokémon's Standings, always in Start order</param>
public record TournamentDto(
    Guid Id,
    DateTimeOffset StartedAt,
    int RoundsPlayed,
    IReadOnlyList<StandingsEntryDto> Standings)
{
    /// <summary>
    /// Copies a Tournament's current state.
    /// </summary>
    /// <param name="tournament">The Tournament</param>
    /// <returns>A snapshot of the Tournament and its Standings</returns>
    public static TournamentDto From(Tournament tournament) => new(
        tournament.Id,
        tournament.StartedAt,
        tournament.RoundsPlayed,
        tournament.Pokemons.Select(StandingsEntryDto.From).ToList());
}
