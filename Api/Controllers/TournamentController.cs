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
    /// <response code="404">No Tournament is held under that id; a malformed id matches no route and gets an empty body</response>
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
            return Ok(_tournamentService.GetTournament(id));
        }
        catch (TournamentNotFoundException)
        {
            return TournamentNotFound(id);
        }
        catch (Exception ex)
        {
            return UnexpectedError(ex, "getting tournament", id);
        }
    }

    /// <summary>
    /// Processes the next Round of a Tournament: pairs its 16 Pokémon into 8 Battles, decides them and updates
    /// the Standings. The API picks the Round; simultaneous calls are processed one after another.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <returns>The Round just played, with the updated Standings</returns>
    /// <response code="201">The Round was played; Location points to it</response>
    /// <response code="404">No Tournament is held under that id</response>
    /// <response code="409">The Tournament is already Complete</response>
    /// <response code="429">Rate limit exceeded</response>
    /// <response code="500">An unexpected error occurred</response>
    [HttpPost("{id:guid}/rounds")]
    [EnableRateLimiting(RateLimitPolicies.RoundByRound)]
    [ProducesResponseType(typeof(ProcessedRoundDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public IActionResult ProcessRound(Guid id)
    {
        try
        {
            var round = _tournamentService.ProcessRound(id);
            return Created(Url.Action(nameof(GetRound), new { id, roundNumber = round.RoundNumber }), round);
        }
        catch (TournamentNotFoundException)
        {
            return TournamentNotFound(id);
        }
        catch (TournamentCompleteException)
        {
            _logger.LogWarning("Process Round refused: tournament {TournamentId} is already complete", id);
            return Conflict(new { error = "Tournament is already complete." });
        }
        catch (Exception ex)
        {
            return UnexpectedError(ex, "processing a round of tournament", id);
        }
    }

    /// <summary>
    /// Gets a played Round of a Tournament with its 8 Battles.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <param name="roundNumber">The Round's number, 1 to 15</param>
    /// <returns>The Round</returns>
    /// <response code="200">Returns the Round</response>
    /// <response code="404">No Tournament is held under that id, or the Round is outside 1–15 or not played yet</response>
    /// <response code="429">Rate limit exceeded</response>
    /// <response code="500">An unexpected error occurred</response>
    [HttpGet("{id:guid}/rounds/{roundNumber:int}")]
    [EnableRateLimiting(RateLimitPolicies.RoundByRound)]
    [ProducesResponseType(typeof(RoundDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public IActionResult GetRound(Guid id, int roundNumber)
    {
        try
        {
            return Ok(_tournamentService.GetRound(id, roundNumber));
        }
        catch (TournamentNotFoundException)
        {
            return TournamentNotFound(id);
        }
        catch (RoundNotFoundException)
        {
            _logger.LogWarning("Round {RoundNumber} of tournament {TournamentId} was not found", roundNumber, id);
            return NotFound(new { error = "Round not found." });
        }
        catch (Exception ex)
        {
            return UnexpectedError(ex, "getting a round of tournament", id);
        }
    }

    /// <summary>
    /// Gets a played Battle of a Tournament with both Pokémon and its winner.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <param name="battleId">The Battle's number within the Tournament, 1 to 120</param>
    /// <returns>The Battle</returns>
    /// <response code="200">Returns the Battle</response>
    /// <response code="404">No Tournament is held under that id, or the Battle is outside 1–120 or not played yet</response>
    /// <response code="429">Rate limit exceeded</response>
    /// <response code="500">An unexpected error occurred</response>
    [HttpGet("{id:guid}/battles/{battleId:int}")]
    [EnableRateLimiting(RateLimitPolicies.RoundByRound)]
    [ProducesResponseType(typeof(BattleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public IActionResult GetBattle(Guid id, int battleId)
    {
        try
        {
            return Ok(_tournamentService.GetBattle(id, battleId));
        }
        catch (TournamentNotFoundException)
        {
            return TournamentNotFound(id);
        }
        catch (BattleNotFoundException)
        {
            _logger.LogWarning("Battle {BattleId} of tournament {TournamentId} was not found", battleId, id);
            return NotFound(new { error = "Battle not found." });
        }
        catch (Exception ex)
        {
            return UnexpectedError(ex, "getting a battle of tournament", id);
        }
    }

    private NotFoundObjectResult TournamentNotFound(Guid tournamentId)
    {
        // Expected after an API restart or with a stale link, so the id is enough without the stack trace
        _logger.LogWarning("Tournament {TournamentId} was not found", tournamentId);
        return NotFound(new { error = "Tournament not found." });
    }

    private ObjectResult UnexpectedError(Exception ex, string operation, Guid tournamentId)
    {
        _logger.LogError(ex, "An unexpected error occurred while {Operation} {TournamentId}", operation, tournamentId);
        return Problem("An unexpected error occurred", statusCode: 500);
    }
}
