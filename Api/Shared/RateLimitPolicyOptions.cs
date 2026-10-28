namespace Api.Shared;

/// <summary>
/// The numbers of one rate-limit policy, read from its <c>RateLimiting:{policy name}</c> configuration section.
/// Every value is nullable so that a missing key fails validation instead of silently becoming 0.
/// </summary>
public class RateLimitPolicyOptions
{
    /// <summary>
    /// The configuration section that holds one sub-section per policy.
    /// </summary>
    public const string ParentSectionName = "RateLimiting";

    /// <summary>
    /// Requests allowed per window.
    /// </summary>
    public int? PermitLimit { get; set; }

    /// <summary>
    /// Length of the window, in seconds.
    /// </summary>
    public int? WindowSeconds { get; set; }

    /// <summary>
    /// Requests that wait for the next window once the permits are spent.
    /// </summary>
    public int? QueueLimit { get; set; }
}
