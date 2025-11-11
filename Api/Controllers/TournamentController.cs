using Api.Application;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Controllers;

/// <summary>
/// Controller responsible for Pokémon tournament operations.
/// Handles tournament simulation and statistics retrieval.
/// </summary>
[ApiController]
[Route("pokemon/tournament")]
[EnableRateLimiting("TournamentPolicy")]
public class TournamentController : ControllerBase
{
    private readonly ITournamentService _tournamentService;
    private readonly ILogger<TournamentController> _logger;

    public TournamentController(
        ITournamentService tournamentService,
        ILogger<TournamentController> logger)
    {
        _tournamentService = tournamentService;
        _logger = logger;
    }

    /// <summary>
    /// Simulates a Pokémon tournament and returns calculated statistics.
    /// </summary>
    /// <param name="sortBy">Field to sort by (wins, losses, ties, name, id)</param>
    /// <param name="sortDirection">Sort direction (asc or desc). Defaults to asc.</param>
    /// <returns>List of tournament Pokémon with battle statistics</returns>
    /// <response code="200">Returns the tournament statistics</response>
    /// <response code="400">Invalid parameters provided</response>
    /// <response code="429">Rate limit exceeded</response>
    /// <response code="500">An unexpected error occurred</response>
    [HttpGet("statistics")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetTournamentStatistics(
        [FromQuery] string? sortBy,
        [FromQuery] string? sortDirection = "asc")
    {
        // Validate required query parameter: sortBy
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            _logger.LogWarning("GetTournamentStatistics called without sortBy parameter");
            return BadRequest(new { error = "sortBy parameter is required" });
        }

        // Validate sort field
        var validSorts = new[] { "wins", "losses", "ties", "name", "id" };
        if (!validSorts.Contains(sortBy.ToLower()))
        {
            _logger.LogWarning("GetTournamentStatistics called with invalid sortBy: {SortBy}", sortBy);
            return BadRequest(new { error = "sortBy parameter is invalid" });
        }

        // Validate sort direction
        if (!string.IsNullOrWhiteSpace(sortDirection))
        {
            var validDirections = new[] { "asc", "desc" };
            if (!validDirections.Contains(sortDirection.ToLower()))
            {
                _logger.LogWarning("GetTournamentStatistics called with invalid sortDirection: {SortDirection}", sortDirection);
                return BadRequest(new { error = "sortDirection parameter is invalid" });
            }
        }

        try
        {
            _logger.LogInformation("Executing tournament simulation with sortBy={SortBy}, sortDirection={SortDirection}", 
                sortBy, sortDirection);

            var result = await _tournamentService.GetTournamentStatistics(sortBy, sortDirection ?? "asc");
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred while executing tournament simulation");
            return Problem("An unexpected error occurred", statusCode: 500);
        }
    }
}
