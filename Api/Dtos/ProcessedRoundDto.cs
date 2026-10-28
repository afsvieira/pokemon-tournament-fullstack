using Api.Domain;

namespace Api.Dtos;

/// <summary>
/// The Round Process Round just played, with the Standings it left behind.
/// </summary>
/// <param name="RoundNumber">The Round's number, 1 to 15</param>
/// <param name="Battles">The Round's 8 Battles, in circle-method order</param>
/// <param name="Standings">The 16 Pokémon's Standings after this Round, in Start order</param>
public record ProcessedRoundDto(
    int RoundNumber,
    IReadOnlyList<BattleDto> Battles,
    IReadOnlyList<StandingsEntryDto> Standings)
{
    /// <summary>
    /// Builds the response for a Round just played.
    /// </summary>
    /// <param name="round">The Round just played</param>
    /// <param name="tournament">The Tournament it belongs to</param>
    /// <returns>The Round with its Battles and the updated Standings</returns>
    public static ProcessedRoundDto From(Round round, Tournament tournament)
    {
        var playedRound = RoundDto.From(round, tournament);
        return new ProcessedRoundDto(
            playedRound.RoundNumber,
            playedRound.Battles,
            tournament.Pokemons.Select(StandingsEntryDto.From).ToList());
    }
}
