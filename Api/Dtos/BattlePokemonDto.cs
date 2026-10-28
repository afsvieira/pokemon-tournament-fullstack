using Api.Domain;

namespace Api.Dtos;

/// <summary>
/// One side of a Battle: the Pokémon without its Standings.
/// </summary>
/// <param name="Id">The Pokémon's id</param>
/// <param name="Name">The capitalized name</param>
/// <param name="Type">The primary type</param>
/// <param name="BaseExperience">The base experience</param>
/// <param name="ImageUrl">The front sprite URL, when PokéAPI has one</param>
public record BattlePokemonDto(int Id, string Name, string Type, int BaseExperience, string? ImageUrl)
{
    /// <summary>
    /// Copies the parts of a Tournament Pokémon that a Battle shows.
    /// </summary>
    /// <param name="pokemon">The Tournament Pokémon</param>
    /// <returns>The Pokémon as a Battle shows it</returns>
    public static BattlePokemonDto From(TournamentPokemon pokemon) => new(
        pokemon.Id,
        pokemon.Name,
        pokemon.Type,
        pokemon.BaseExperience,
        pokemon.ImageUrl);
}
