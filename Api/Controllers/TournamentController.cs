using Api.Application;
using Api.Dtos;
using Api.Shared;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Controllers;

/// <summary>
/// Controller responsible for Pokémon tournament operations.
/// Handles tournament simulation and statistics retrieval.
/// </summary>
[ApiController]
[Route("pokemon/tournament")]
[EnableRateLimiting(RateLimitPolicies.InstantSimulation)]
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
        if (string.IsNullOrWhiteSpace(sortBy))
        {
            _logger.LogWarning("GetTournamentStatistics called without sortBy parameter");
            return BadRequest(new { error = "sortBy parameter is required" });
        }

        var validSorts = new[] { "wins", "losses", "ties", "name", "id" };
        if (!validSorts.Contains(sortBy.ToLower()))
        {
            _logger.LogWarning("GetTournamentStatistics called with invalid sortBy: {SortBy}", sortBy);
            return BadRequest(new { error = "sortBy parameter is invalid" });
        }

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

    /// <summary>
    /// Starts a round-by-round Tournament with 16 random Pokémon, held in memory until the API restarts.
    /// </summary>
    /// <returns>The new Tournament, with every Pokémon at 0 wins, losses and ties</returns>
    /// <response code="201">The Tournament was started; Location points to it</response>
    /// <response code="429">Rate limit exceeded</response>
    /// <response code="500">An unexpected error occurred</response>
    /// <response code="502">PokéAPI failed or returned fewer than 16 Pokémon; nothing was stored</response>
    [HttpPost]
    [EnableRateLimiting(RateLimitPolicies.StartTournament)]
    [ProducesResponseType(typeof(TournamentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> StartTournament()
    {
        try
        {
            var tournament = await _tournamentService.StartTournament();
            return Created(Url.Action(nameof(GetTournament), new { id = tournament.Id }), tournament);
        }
        catch (PokemonUnavailableException ex)
        {
            _logger.LogError(ex, "Could not start a tournament");
            return StatusCode(
                StatusCodes.Status502BadGateway,
                new { error = "Could not start a tournament right now. Try again later." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred while starting a tournament");
            return Problem("An unexpected error occurred", statusCode: 500);
        }
    }

    /// <summary>
    /// Gets a round-by-round Tournament with its current Standings.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <returns>The Tournament</returns>
    /// <response code="200">Returns the Tournament</response>
    /// <response code="404">No Tournament is held under that id</response>
    /// <response code="429">Rate limit exceeded</response>
    /// <response code="500">An unexpected error occurred</response>
    [HttpGet("{id:guid}")]
    [EnableRateLimiting(RateLimitPolicies.RoundByRound)]
    [ProducesResponseType(typeof(TournamentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public IActionResult GetTournament(Guid id)
    {
        try
        {
            var tournament = _tournamentService.GetTournament(id);
            return tournament is null ? NotFound() : Ok(tournament);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred while getting tournament {TournamentId}", id);
            return Problem("An unexpected error occurred", statusCode: 500);
        }
    }
}
