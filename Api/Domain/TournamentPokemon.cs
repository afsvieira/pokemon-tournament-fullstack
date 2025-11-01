namespace Api.Domain;

/// <summary>
/// Represents a Pokémon participating in the tournament,
/// including basic attributes, battle statistics, and recorded battle history.
/// </summary>
public class TournamentPokemon
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int BaseExperience { get; set; }
    public int Wins { get; set; }
    public int Losses { get; set; }
    public int Ties { get; set; }

    /// <summary>
    /// Calculates the win rate as a percentage of total battles.
    /// </summary>
    public double WinRate => (Wins + Losses + Ties) == 0
        ? 0
        : Math.Round((double)Wins / (Wins + Losses + Ties) * 100, 2);
    
     /// <summary>
    /// Stores the list of all battles this Pokémon participated in.
    /// </summary>
    public List<BattleRecord> BattleRecords { get; private set; } = new();

    /// <summary>
    /// Registers the outcome of a single battle and updates statistics accordingly.
    /// </summary>
    /// <param name="opponent">The opposing Pokémon in the battle.</param>
    /// <param name="result">The result of the battle for this Pokémon.</param>
    public void BattleRegister(TournamentPokemon opponent, BattleOutcomeEnum result)
    {        
        
        BattleRecords.Add(new BattleRecord
        {
            OpponentName = opponent.Name,
            OpponentType = opponent.Type,
            Result = result
        });

        switch (result)
        {
            case BattleOutcomeEnum.Win:
                Wins++;
                break;
            case BattleOutcomeEnum.Loss:
                Losses++;
                break;
            case BattleOutcomeEnum.Tie:
                Ties++;
                break;

        }
    }
}