namespace Api.Domain;

/// <summary>
/// Represents a single recorded battle between two Pokémon,
/// storing the opponent’s basic information and the outcome.
/// </summary>
public class BattleRecord
{
    public string OpponentName { get; set; } = string.Empty;
    public string OpponentType { get; set; } = string.Empty;
    public BattleOutcomeEnum Result { get; set; }
}