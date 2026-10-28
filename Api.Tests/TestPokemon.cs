using Api.Domain;

namespace Api.Tests;

/// <summary>
/// Builds the Pokémon a faked PokéAPI returns, named in lowercase as PokéAPI sends them.
/// </summary>
internal static class TestPokemon
{
    /// <summary>
    /// Sixteen Kanto ids in an order that is not sorted, so tests can tell Start order from id order.
    /// </summary>
    public static readonly int[] SixteenIds = [25, 4, 7, 1, 150, 133, 94, 6, 9, 3, 143, 130, 131, 65, 68, 59];

    /// <summary>
    /// Creates one Pokémon per id, in the given order, named <c>pokemon{id}</c>.
    /// </summary>
    /// <param name="ids">The Pokémon ids, in the order PokéAPI returns them</param>
    /// <returns>New Pokémon with no battles</returns>
    public static List<TournamentPokemon> FromIds(IEnumerable<int> ids)
    {
        return ids.Select(id => new TournamentPokemon
        {
            Id = id,
            Name = $"pokemon{id}",
            Type = "normal",
            BaseExperience = 50 + id,
            ImageUrl = $"https://img.example/{id}.png"
        }).ToList();
    }
}
