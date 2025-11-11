namespace Api.Domain;

/// <summary>
/// Encapsulates the battle logic and rules for Pokémon tournaments.
/// Determines battle outcomes based on type advantages and base experience.
/// </summary>
public class BattleSimulator
{
    private readonly Dictionary<string, string> _typeAdvantages;

    public BattleSimulator()
    {
        _typeAdvantages = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            {"water", "fire"},
            {"fire", "grass"},
            {"grass", "electric"},
            {"electric", "water"},
            {"ghost", "psychic"},
            {"psychic", "fighting"},
            {"fighting", "dark"},
            {"dark", "ghost"}
        };
    }

    /// <summary>
    /// Simulates all-versus-all battles between a list of Pokémon.
    /// Updates each Pokémon's battle statistics and records.
    /// </summary>
    /// <param name="pokemons">List of Pokémon to battle against each other</param>
    public void SimulateAllBattles(List<TournamentPokemon> pokemons)
    {
        for (int i = 0; i < pokemons.Count; i++)
        {
            for (int j = i + 1; j < pokemons.Count; j++)
            {
                var p1 = pokemons[i];
                var p2 = pokemons[j];
                var resultForP1 = DetermineBattleOutcome(p1, p2);

                switch (resultForP1)
                {
                    case BattleOutcomeEnum.Win:
                        p1.BattleRegister(p2, BattleOutcomeEnum.Win);
                        p2.BattleRegister(p1, BattleOutcomeEnum.Loss);
                        break;
                    case BattleOutcomeEnum.Loss:
                        p1.BattleRegister(p2, BattleOutcomeEnum.Loss);
                        p2.BattleRegister(p1, BattleOutcomeEnum.Win);
                        break;
                    case BattleOutcomeEnum.Tie:
                        p1.BattleRegister(p2, BattleOutcomeEnum.Tie);
                        p2.BattleRegister(p1, BattleOutcomeEnum.Tie);
                        break;
                }
            }
        }
    }

    /// <summary>
    /// Determines the outcome of a battle between two Pokémon.
    /// Priority: Type advantage > Base experience > Tie
    /// </summary>
    /// <param name="p1">First Pokémon</param>
    /// <param name="p2">Second Pokémon</param>
    /// <returns>Battle outcome from the perspective of the first Pokémon</returns>
    public BattleOutcomeEnum DetermineBattleOutcome(TournamentPokemon p1, TournamentPokemon p2)
    {
        var type1 = p1.Type.ToLower();
        var type2 = p2.Type.ToLower();

        if (_typeAdvantages.ContainsKey(type1) && _typeAdvantages[type1] == type2)
            return BattleOutcomeEnum.Win;
        if (_typeAdvantages.ContainsKey(type2) && _typeAdvantages[type2] == type1)
            return BattleOutcomeEnum.Loss;

        if (p1.BaseExperience > p2.BaseExperience)
            return BattleOutcomeEnum.Win;
        if (p1.BaseExperience < p2.BaseExperience)
            return BattleOutcomeEnum.Loss;

        return BattleOutcomeEnum.Tie;
    }
}
