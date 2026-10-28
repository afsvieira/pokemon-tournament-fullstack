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
    /// Number of Rounds it takes for every Pokémon to meet every other once.
    /// </summary>
    public const int RoundCount = PokemonCount - 1;

    /// <summary>
    /// Number of Battles in each Round, where every Pokémon fights once.
    /// </summary>
    public const int BattlesPerRound = PokemonCount / 2;

    private readonly List<Round> _rounds = new();

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
    /// The Rounds processed so far, in order.
    /// </summary>
    public IReadOnlyList<Round> Rounds => _rounds;

    /// <summary>
    /// Number of Rounds processed so far.
    /// </summary>
    public int RoundsPlayed => _rounds.Count;

    /// <summary>
    /// Whether all 15 Rounds have been processed.
    /// </summary>
    public bool IsComplete => RoundsPlayed == RoundCount;

    /// <summary>
    /// The Tournament's own lock. Callers hold it while processing a Round and while reading the Tournament,
    /// so no one sees a Battle registered on one Pokémon but not yet on the other.
    /// </summary>
    public Lock SyncRoot { get; } = new();

    /// <summary>
    /// Gets one of the Tournament's Pokémon.
    /// </summary>
    /// <param name="pokemonId">The Pokémon's id</param>
    /// <returns>The Tournament's Pokémon, with its current Standings</returns>
    public TournamentPokemon GetPokemon(int pokemonId)
    {
        return Pokemons.First(pokemon => pokemon.Id == pokemonId);
    }

    /// <summary>
    /// Processes the next Round: pairs the Pokémon with the circle method, decides each Battle with the battle rules
    /// and registers it on both Pokémon. Nothing about later Rounds is computed or stored.
    /// </summary>
    /// <param name="battleSimulator">Decides each Battle</param>
    /// <returns>The Round just played</returns>
    /// <exception cref="InvalidOperationException">When the Tournament is already Complete</exception>
    public Round PlayNextRound(BattleSimulator battleSimulator)
    {
        if (IsComplete)
            throw new InvalidOperationException($"All {RoundCount} Rounds of Tournament {Id} have been played.");

        var roundNumber = RoundsPlayed + 1;
        var firstBattleId = BattlesPerRound * (roundNumber - 1) + 1;
        var battles = PairsForRound(roundNumber)
            .Select((pair, indexInRound) => PlayBattle(battleSimulator, firstBattleId + indexInRound, roundNumber, pair))
            .ToList();

        var round = new Round(roundNumber, battles);
        _rounds.Add(round);
        return round;
    }

    /// <summary>
    /// Circle method over the Start order: the first Pokémon stays fixed and the other 15 rotate one position per
    /// Round, so over 15 Rounds every pair meets exactly once. Within a pair, the earlier Pokémon in Start order comes first.
    /// </summary>
    private IEnumerable<(TournamentPokemon Pokemon1, TournamentPokemon Pokemon2)> PairsForRound(int roundNumber)
    {
        var rotatingCount = PokemonCount - 1;
        var positions = new int[PokemonCount];
        for (var slot = 1; slot < PokemonCount; slot++)
        {
            positions[slot] = 1 + (slot - 1 + roundNumber - 1) % rotatingCount;
        }

        for (var slot = 0; slot < BattlesPerRound; slot++)
        {
            var first = positions[slot];
            var second = positions[PokemonCount - 1 - slot];
            yield return (Pokemons[Math.Min(first, second)], Pokemons[Math.Max(first, second)]);
        }
    }

    private static Battle PlayBattle(
        BattleSimulator battleSimulator,
        int battleId,
        int roundNumber,
        (TournamentPokemon Pokemon1, TournamentPokemon Pokemon2) pair)
    {
        var (pokemon1, pokemon2) = pair;
        var outcomeForPokemon1 = battleSimulator.DetermineBattleOutcome(pokemon1, pokemon2);
        pokemon1.BattleRegister(pokemon2, outcomeForPokemon1);
        pokemon2.BattleRegister(pokemon1, Reverse(outcomeForPokemon1));

        int? winnerId = outcomeForPokemon1 switch
        {
            BattleOutcomeEnum.Win => pokemon1.Id,
            BattleOutcomeEnum.Loss => pokemon2.Id,
            _ => null
        };

        return new Battle(battleId, roundNumber, pokemon1.Id, pokemon2.Id, winnerId);
    }

    private static BattleOutcomeEnum Reverse(BattleOutcomeEnum outcome) => outcome switch
    {
        BattleOutcomeEnum.Win => BattleOutcomeEnum.Loss,
        BattleOutcomeEnum.Loss => BattleOutcomeEnum.Win,
        _ => BattleOutcomeEnum.Tie
    };
}
