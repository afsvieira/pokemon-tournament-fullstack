using Api.Domain;

namespace Api.Dtos;

/// <summary>
/// A played Round as the Round endpoint returns it.
/// </summary>
/// <param name="RoundNumber">The Round's number, 1 to 15</param>
/// <param name="Battles">The Round's 8 Battles, in circle-method order</param>
public record RoundDto(int RoundNumber, IReadOnlyList<BattleDto> Battles)
{
    /// <summary>
    /// Builds a Round with its Battles.
    /// </summary>
    /// <param name="round">The Round</param>
    /// <param name="tournament">The Tournament the Round belongs to</param>
    /// <returns>The Round with its Battles' details</returns>
    public static RoundDto From(Round round, Tournament tournament) => new(
        round.Number,
        round.Battles.Select(battle => BattleDto.From(battle, tournament)).ToList());
}
