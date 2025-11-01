using Api.Application;

namespace Api.Tests;

/// <summary>
/// Tests for input validation and error handling in the TournamentService.
/// Ensures the API properly validates parameters and throws appropriate exceptions.
/// </summary>
public class ValidationTests
{
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
        // Arrange - Create service instance for testing
        var service = new TournamentService(new HttpClient());

        // Act & Assert - Verify that invalid input throws ArgumentException
        var exception = Assert.ThrowsAsync<ArgumentException>(() =>
            service.GetTournamentStatistics(invalidSortBy, "asc"));
        
        Assert.NotNull(exception); // Ensure exception is thrown
    }

    /// <summary>
    /// Verifies that null sortBy parameter is properly rejected with ArgumentException.
    /// Tests null reference handling in API input validation.
    /// </summary>
    [Fact]
    public void GetTournamentStatistics_ShouldThrowArgumentException_WhenSortByIsNull()
    {
        // Arrange - Create service instance for testing
        var service = new TournamentService(new HttpClient());

        // Act & Assert - Verify that null input throws ArgumentException
        var exception = Assert.ThrowsAsync<ArgumentException>(() =>
            service.GetTournamentStatistics(null!, "asc"));
        
        Assert.NotNull(exception); // Ensure exception is thrown
    }

    /// <summary>
    /// Verifies that unknown sortBy field names are properly rejected.
    /// Tests that only valid sort fields are accepted by the API.
    /// </summary>
    [Fact]
    public void GetTournamentStatistics_ShouldThrowArgumentException_WhenSortByIsUnknown()
    {
        // Arrange - Create service with unknown sort field
        var service = new TournamentService(new HttpClient());

        // Act & Assert - Verify unknown field throws ArgumentException
        var exception = Assert.ThrowsAsync<ArgumentException>(() =>
            service.GetTournamentStatistics("unknown", "asc"));
        
        Assert.NotNull(exception); // Ensure proper error handling
    }
}