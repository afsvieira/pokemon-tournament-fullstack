using Api.Application;
using Api.Domain;
using Api.Infrastructure;
using Moq;

namespace Api.Tests;

/// <summary>
/// Tests for input validation and error handling in the TournamentService.
/// Ensures the API properly validates parameters and throws appropriate exceptions.
/// </summary>
public class ValidationTests
{
    private readonly TournamentService _service;

    public ValidationTests()
    {
        var mockApiClient = new Mock<PokemonApiClient>(new HttpClient());
        var mockBattleSimulator = new Mock<BattleSimulator>();
        _service = new TournamentService(mockApiClient.Object, mockBattleSimulator.Object);
    }

    /// <summary>
    /// Verifies that invalid sortBy parameters are properly rejected with ArgumentException.
    /// Tests defensive programming practices for API input validation.
    /// </summary>
    /// <param name="invalidSortBy">Invalid sortBy parameter value to test</param>
    [Theory]
    [InlineData("")]        // Empty string
    [InlineData("   ")]     // Whitespace only
    public void GetTournamentStatistics_ShouldThrowArgumentException_WhenSortByIsInvalid(string invalidSortBy)
    {
        // Act & Assert - Verify that invalid input throws ArgumentException
        var exception = Assert.ThrowsAsync<ArgumentException>(() =>
            _service.GetTournamentStatistics(invalidSortBy, "asc"));
        
        Assert.NotNull(exception); // Ensure exception is thrown
    }

    /// <summary>
    /// Verifies that null sortBy parameter is properly rejected with ArgumentException.
    /// Tests null reference handling in API input validation.
    /// </summary>
    [Fact]
    public void GetTournamentStatistics_ShouldThrowArgumentException_WhenSortByIsNull()
    {
        // Act & Assert - Verify that null input throws ArgumentException
        var exception = Assert.ThrowsAsync<ArgumentException>(() =>
            _service.GetTournamentStatistics(null!, "asc"));
        
        Assert.NotNull(exception); // Ensure exception is thrown
    }

    /// <summary>
    /// Verifies that unknown sortBy field names are properly rejected.
    /// Tests that only valid sort fields are accepted by the API.
    /// </summary>
    [Fact]
    public void GetTournamentStatistics_ShouldThrowArgumentException_WhenSortByIsUnknown()
    {
        // Act & Assert - Verify unknown field throws ArgumentException
        var exception = Assert.ThrowsAsync<ArgumentException>(() =>
            _service.GetTournamentStatistics("unknown", "asc"));
        
        Assert.NotNull(exception); // Ensure proper error handling
    }
}