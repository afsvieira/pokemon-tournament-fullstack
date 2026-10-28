# 07: Rate-limit numbers in configuration

**Spec:** [Round-by-round Tournament](../spec.md)

**What to build:** The Instant Simulation's rate limit reads its numbers from application configuration instead of code, and behaves exactly as before. The API refuses to start when those numbers are missing. This is a prefactor: once it lands, the new Tournament policies in later tickets only need configuration entries.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Application configuration has a `RateLimiting` section with a `TournamentPolicy` sub-section: `PermitLimit` 10, `WindowSeconds` 60, `QueueLimit` 5.
- [x] `TournamentPolicy` takes its permit limit, window and queue limit from that sub-section. The fixed-window type and the client-IP partition stay in code.
- [x] Code holds no fallback defaults. A missing or invalid sub-section makes the API fail at startup, with a message naming the section.
- [x] The Instant Simulation endpoint answers exactly as before: same results, same 10-per-minute limit with a queue of 5, same empty-body 429.
- [x] The existing rate-limiting test still passes.
- [x] A new `WebApplicationFactory<Program>` test shows the API failing to start when the `TournamentPolicy` sub-section is missing.
- [x] `.claude/ARCHITECTURE.md` ("Values that change together") and the README say that the rate-limit numbers live in configuration.

## Comments

**Done** in commit `734a593` (refactor(api): read rate-limit numbers from configuration).
