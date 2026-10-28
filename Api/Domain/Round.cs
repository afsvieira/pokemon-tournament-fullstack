namespace Api.Domain;

/// <summary>
/// One step of a Tournament: 8 Battles in which each of the 16 Pokémon fights exactly once.
/// </summary>
/// <param name="Number">The Round's number, 1 to 15</param>
/// <param name="Battles">The 8 Battles, in circle-method order</param>
public record Round(int Number, IReadOnlyList<Battle> Battles);
