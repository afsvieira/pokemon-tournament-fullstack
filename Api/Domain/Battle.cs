namespace Api.Domain;

/// <summary>
/// One fight between two Pokémon of a Tournament, decided by the battle rules.
/// </summary>
/// <param name="Id">The Battle's number within its Tournament, 1 to 120 in play order</param>
/// <param name="RoundNumber">The Round the Battle belongs to, 1 to 15</param>
/// <param name="Pokemon1Id">The Pokémon that comes first in the Start order</param>
/// <param name="Pokemon2Id">The other Pokémon</param>
/// <param name="WinnerId">The winner's Pokémon id, or null on a tie</param>
public record Battle(int Id, int RoundNumber, int Pokemon1Id, int Pokemon2Id, int? WinnerId);
