using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace Api.Shared;

/// <summary>
/// Registers rate-limit policies whose numbers come from application configuration.
/// </summary>
public static class RateLimitingExtensions
{
    /// <summary>
    /// Adds a fixed-window rate-limit policy partitioned by client IP. Its permit limit, window and queue limit
    /// come from the <c>RateLimiting:{policyName}</c> configuration section, with no defaults in code:
    /// the API fails at startup when that section is missing or invalid.
    /// </summary>
    /// <param name="services">The service collection to register the policy in</param>
    /// <param name="policyName">The policy name used by <c>[EnableRateLimiting]</c>, and the name of its configuration sub-section</param>
    /// <returns>The same service collection, for chaining</returns>
    public static IServiceCollection AddFixedWindowRateLimitPolicy(this IServiceCollection services, string policyName)
    {
        var sectionPath = $"{RateLimitPolicyOptions.ParentSectionName}:{policyName}";

        services.AddOptions<RateLimitPolicyOptions>(policyName)
            .BindConfiguration(sectionPath)
            .Validate(
                // A missing value is null, and every comparison with null is false
                limits => limits.PermitLimit >= 1 && limits.WindowSeconds >= 1 && limits.QueueLimit >= 0,
                $"Configuration section '{sectionPath}' must set PermitLimit (1 or more), WindowSeconds (1 or more) and QueueLimit (0 or more).")
            .ValidateOnStart();

        services.AddOptions<RateLimiterOptions>()
            .Configure<IOptionsMonitor<RateLimitPolicyOptions>>((options, optionsMonitor) =>
            {
                var limits = optionsMonitor.Get(policyName);

                options.AddPolicy(policyName, context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = limits.PermitLimit!.Value,
                            Window = TimeSpan.FromSeconds(limits.WindowSeconds!.Value),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = limits.QueueLimit!.Value
                        }));
            });

        return services;
    }
}
