using Api.Domain;

namespace Api.Dtos;

/// <summary>
/// One Pokémon's Standings in a Tournament: the Instant Simulation's Pokémon shape without its battle records.
/// </summary>
/// <param name="Id">The Pokémon's id</param>
/// <param name="Name">The capitalized name</param>
/// <param name="Type">The primary type</param>
/// <param name="BaseExperience">The base experience</param>
/// <param name="ImageUrl">The front sprite URL, when PokéAPI has one</param>
/// <param name="Wins">Battles won so far</param>
/// <param name="Losses">Battles lost so far</param>
/// <param name="Ties">Battles tied so far</param>
/// <param name="WinRate">Wins as a percentage of Battles fought, 0 before any Battle</param>
public record StandingsEntryDto(
    int Id,
    string Name,
    string Type,
    int BaseExperience,
    string? ImageUrl,
    int Wins,
    int Losses,
    int Ties,
    double WinRate)
{
    /// <summary>
    /// Copies a Tournament Pokémon's current Standings.
    /// </summary>
    /// <param name="pokemon">The Tournament Pokémon</param>
    /// <returns>A snapshot of its Standings</returns>
    public static StandingsEntryDto From(TournamentPokemon pokemon) => new(
        pokemon.Id,
        pokemon.Name,
        pokemon.Type,
        pokemon.BaseExperience,
        pokemon.ImageUrl,
        pokemon.Wins,
        pokemon.Losses,
        pokemon.Ties,
        pokemon.WinRate);
}
