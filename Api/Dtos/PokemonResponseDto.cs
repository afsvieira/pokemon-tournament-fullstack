namespace Api.Dtos;

/// <summary>
/// Represents the structure of the Pokémon data returned by the external PokeAPI.
/// </summary>
public class PokemonResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Base_Experience { get; set; }
    public IEnumerable<TypeSlot> Types { get; set; } = new List<TypeSlot>();
}

/// <summary>
/// Represents one type slot entry in the PokeAPI response.
/// </summary>
public class TypeSlot
{
    public int Slot { get; set; }
    public TypeDetail Type { get; set; }

}
/// <summary>
/// Contains the type's name and reference URL from the PokeAPI.
/// </summary>
public class TypeDetail
{
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}