using Api.Domain;

namespace Api.Dtos;

/// <summary>
/// A Battle as the round-by-round endpoints return it.
/// </summary>
/// <param name="Id">The Battle's number within its Tournament, 1 to 120 in play order</param>
/// <param name="RoundNumber">The Round the Battle belongs to</param>
/// <param name="Pokemon1">The Pokémon that comes first in the Start order</param>
/// <param name="Pokemon2">The other Pokémon</param>
/// <param name="WinnerId">The winner's Pokémon id, or null on a tie</param>
public record BattleDto(int Id, int RoundNumber, BattlePokemonDto Pokemon1, BattlePokemonDto Pokemon2, int? WinnerId)
{
    /// <summary>
    /// Builds a Battle with both Pokémon looked up in its Tournament.
    /// </summary>
    /// <param name="battle">The Battle</param>
    /// <param name="tournament">The Tournament the Battle belongs to</param>
    /// <returns>The Battle with both Pokémon's details</returns>
    public static BattleDto From(Battle battle, Tournament tournament) => new(
        battle.Id,
        battle.RoundNumber,
        BattlePokemonDto.From(tournament.GetPokemon(battle.Pokemon1Id)),
        BattlePokemonDto.From(tournament.GetPokemon(battle.Pokemon2Id)),
        battle.WinnerId);
}
