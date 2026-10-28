namespace Api.Shared;

/// <summary>
/// Names of the rate-limit policies, used by <c>[EnableRateLimiting]</c> and as their sub-sections of the
/// <c>RateLimiting</c> configuration section.
/// </summary>
public static class RateLimitPolicies
{
    /// <summary>
    /// The Instant Simulation: 10 per minute with a queue of 5.
    /// </summary>
    public const string InstantSimulation = "TournamentPolicy";

    /// <summary>
    /// Start, the only round-by-round endpoint that calls PokéAPI and creates a Tournament.
    /// </summary>
    public const string StartTournament = "StartTournamentPolicy";

    /// <summary>
    /// Process Round and every round-by-round read, which only touch memory.
    /// </summary>
    public const string RoundByRound = "RoundByRoundPolicy";
}
