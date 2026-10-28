namespace Api.Domain;

/// <summary>
/// A round-robin between 16 Pokémon, held in memory under an id and processed one Round at a time.
/// </summary>
public class Tournament
{
    /// <summary>
    /// Number of Pokémon in every Tournament.
    /// </summary>
    public const int PokemonCount = 16;

    /// <summary>
    /// Creates a Tournament with no Rounds played.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <param name="startedAt">When the Tournament was started, in UTC</param>
    /// <param name="pokemons">The 16 Pokémon in Start order</param>
    /// <exception cref="ArgumentException">When there aren't exactly 16 Pokémon</exception>
    public Tournament(Guid id, DateTimeOffset startedAt, IReadOnlyList<TournamentPokemon> pokemons)
    {
        if (pokemons.Count != PokemonCount)
            throw new ArgumentException($"A Tournament needs {PokemonCount} Pokémon, got {pokemons.Count}.", nameof(pokemons));

        Id = id;
        StartedAt = startedAt;
        Pokemons = pokemons;
    }

    /// <summary>
    /// The Tournament's id.
    /// </summary>
    public Guid Id { get; }

    /// <summary>
    /// When the Tournament was started, in UTC.
    /// </summary>
    public DateTimeOffset StartedAt { get; }

    /// <summary>
    /// The 16 Pokémon in Start order. Their wins, losses and ties are the Standings.
    /// </summary>
    public IReadOnlyList<TournamentPokemon> Pokemons { get; }

    /// <summary>
    /// Number of Rounds processed so far.
    /// </summary>
    public int RoundsPlayed { get; private set; }
}
