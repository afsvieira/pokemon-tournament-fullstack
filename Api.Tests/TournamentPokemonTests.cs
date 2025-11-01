using Api.Domain;

namespace Api.Tests;

/// <summary>
/// Tests for TournamentPokemon domain model, focusing on battle statistics and win rate calculations.
/// </summary>
public class TournamentPokemonTests
{
    /// <summary>
    /// Verifies that WinRate property correctly calculates percentage based on wins vs total battles.
    /// Formula: (Wins / Total Battles) * 100, rounded to 2 decimal places.
    /// </summary>
    /// <param name="wins">Number of battles won</param>
    /// <param name="losses">Number of battles lost</param>
    /// <param name="ties">Number of battles tied</param>
    /// <param name="expectedWinRate">Expected win rate percentage</param>
    [Theory]
    [InlineData(5, 3, 2, 50.0)]   // 5 wins out of 10 total = 50%
    [InlineData(10, 0, 0, 100.0)] // Perfect record = 100%
    [InlineData(0, 10, 0, 0.0)]   // No wins = 0%
    [InlineData(0, 0, 0, 0.0)]    // No battles = 0% (edge case)
    public void WinRate_ShouldCalculateCorrectly(int wins, int losses, int ties, double expectedWinRate)
    {
        // Arrange - Create Pokemon with specific battle statistics
        var pokemon = new TournamentPokemon
        {
            Wins = wins,
            Losses = losses,
            Ties = ties
        };

        // Act - Calculate win rate using the property
        var winRate = pokemon.WinRate;

        // Assert - Verify calculation matches expected percentage
        Assert.Equal(expectedWinRate, winRate);
    }

    /// <summary>
    /// Verifies that BattleRegister method correctly updates both statistics and battle history.
    /// Tests the core functionality of recording a single battle outcome.
    /// </summary>
    [Fact]
    public void BattleRegister_ShouldUpdateStatsAndRecords_Correctly()
    {
        // Arrange - Create two Pokemon for battle simulation
        var pokemon1 = new TournamentPokemon { Name = "Bulbasaur", Type = "grass" };
        var pokemon2 = new TournamentPokemon { Name = "Charmander", Type = "fire" };

        // Act - Register a winning battle for pokemon1
        pokemon1.BattleRegister(pokemon2, BattleOutcomeEnum.Win);

        // Assert - Verify both statistics and battle record are updated
        Assert.Equal(1, pokemon1.Wins);                                    // Win count incremented
        Assert.Single(pokemon1.BattleRecords);                             // One battle recorded
        Assert.Equal("Charmander", pokemon1.BattleRecords[0].OpponentName); // Opponent name stored
        Assert.Equal(BattleOutcomeEnum.Win, pokemon1.BattleRecords[0].Result); // Result stored
    }

    /// <summary>
    /// Verifies that multiple battle registrations correctly accumulate statistics and history.
    /// Tests the system's ability to handle a series of battles with different outcomes.
    /// </summary>
    [Fact]
    public void BattleRegister_ShouldAccumulateMultipleBattles()
    {
        // Arrange - Create Pokemon and multiple opponents for tournament simulation
        var pokemon = new TournamentPokemon();
        var opponent1 = new TournamentPokemon { Name = "Opponent1" };
        var opponent2 = new TournamentPokemon { Name = "Opponent2" };

        // Act - Register multiple battles with different outcomes
        pokemon.BattleRegister(opponent1, BattleOutcomeEnum.Win);  // Win: 1-0-0
        pokemon.BattleRegister(opponent2, BattleOutcomeEnum.Loss); // Loss: 1-1-0
        pokemon.BattleRegister(opponent1, BattleOutcomeEnum.Tie);  // Tie: 1-1-1

        // Assert - Verify all statistics are correctly accumulated
        Assert.Equal(1, pokemon.Wins);                    // One win recorded
        Assert.Equal(1, pokemon.Losses);                  // One loss recorded
        Assert.Equal(1, pokemon.Ties);                    // One tie recorded
        Assert.Equal(3, pokemon.BattleRecords.Count);     // All battles in history
        Assert.Equal(33.33, pokemon.WinRate);             // Win rate: 1/3 * 100 = 33.33%
    }
}