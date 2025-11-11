using Api.Domain;

namespace Api.Tests;

/// <summary>
/// Tests for the core battle logic that determines Pokemon battle outcomes.
/// Focuses on type advantages and base experience tie-breaking rules.
/// </summary>
public class BattleLogicTests
{
    private readonly BattleSimulator _battleSimulator;

    public BattleLogicTests()
    {
        _battleSimulator = new BattleSimulator();
    }

    /// <summary>
    /// Verifies that Pokemon type advantages are correctly applied in battle outcomes.
    /// Tests the core game mechanic where certain types have advantages over others.
    /// </summary>
    /// <param name="attackerType">Type of the attacking Pokemon</param>
    /// <param name="defenderType">Type of the defending Pokemon</param>
    /// <param name="expectedResult">Expected battle outcome based on type matchup</param>
    [Theory]
    [InlineData("water", "fire", BattleOutcomeEnum.Win)]      // Water beats Fire
    [InlineData("fire", "grass", BattleOutcomeEnum.Win)]      // Fire beats Grass
    [InlineData("grass", "electric", BattleOutcomeEnum.Win)]  // Grass beats Electric
    [InlineData("electric", "water", BattleOutcomeEnum.Win)]  // Electric beats Water
    [InlineData("fire", "water", BattleOutcomeEnum.Loss)]     // Fire loses to Water
    [InlineData("grass", "fire", BattleOutcomeEnum.Loss)]     // Grass loses to Fire
    public void DetermineBattleOutcome_ShouldReturnCorrectResult_ForTypeAdvantages(
        string attackerType, string defenderType, BattleOutcomeEnum expectedResult)
    {
        // Arrange - Create Pokemon with same base experience to isolate type advantage testing
        var pokemon1 = CreatePokemon(1, "Attacker", attackerType, 50);
        var pokemon2 = CreatePokemon(2, "Defender", defenderType, 50);

        // Act - Determine battle outcome using internal logic
        var result = _battleSimulator.DetermineBattleOutcome(pokemon1, pokemon2);

        // Assert - Verify type advantage rules are correctly applied
        Assert.Equal(expectedResult, result);
    }

    /// <summary>
    /// Verifies that base experience is used as tie-breaker when no type advantage exists.
    /// Tests the secondary battle resolution mechanism.
    /// </summary>
    /// <param name="exp1">Base experience of first Pokemon</param>
    /// <param name="exp2">Base experience of second Pokemon</param>
    /// <param name="expectedResult">Expected outcome based on experience comparison</param>
    [Theory]
    [InlineData(100, 50, BattleOutcomeEnum.Win)]  // Higher experience wins
    [InlineData(50, 100, BattleOutcomeEnum.Loss)] // Lower experience loses
    [InlineData(75, 75, BattleOutcomeEnum.Tie)]   // Equal experience ties
    public void DetermineBattleOutcome_ShouldUseBaseExperience_WhenNoTypeAdvantage(
        int exp1, int exp2, BattleOutcomeEnum expectedResult)
    {
        // Arrange - Use same type to eliminate type advantage factor
        var pokemon1 = CreatePokemon(1, "Pokemon1", "normal", exp1);
        var pokemon2 = CreatePokemon(2, "Pokemon2", "normal", exp2);

        // Act - Battle outcome should be determined by base experience only
        var result = _battleSimulator.DetermineBattleOutcome(pokemon1, pokemon2);

        // Assert - Verify experience-based tie-breaking works correctly
        Assert.Equal(expectedResult, result);
    }

    /// <summary>
    /// Verifies that type advantage takes precedence over base experience.
    /// Tests the priority order of battle resolution rules.
    /// </summary>
    [Fact]
    public void DetermineBattleOutcome_TypeAdvantage_ShouldOverrideBaseExperience()
    {
        // Arrange - Water Pokemon with much lower experience vs Fire Pokemon with higher experience
        var waterPokemon = CreatePokemon(1, "Squirtle", "water", 30);   // Low experience
        var firePokemon = CreatePokemon(2, "Charmander", "fire", 100);  // High experience

        // Act - Type advantage should override experience disadvantage
        var result = _battleSimulator.DetermineBattleOutcome(waterPokemon, firePokemon);

        // Assert - Water should win despite lower base experience
        Assert.Equal(BattleOutcomeEnum.Win, result);
    }

    private TournamentPokemon CreatePokemon(int id, string name, string type, int baseExp)
    {
        return new TournamentPokemon
        {
            Id = id,
            Name = name,
            Type = type,
            BaseExperience = baseExp
        };
    }
}

