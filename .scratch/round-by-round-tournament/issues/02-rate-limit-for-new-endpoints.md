# Rate limit for the new endpoints

Type: grilling
Status: resolved
Map: [Round-by-round Tournament](../map.md)

## Question

Which rate limit applies to the new endpoints?

`TournamentPolicy` (10 requests per minute per IP, queue of 5, rejections answered 429) is applied to the whole `TournamentController` in `Api/Program.cs`. One full Tournament takes 16 requests (Start plus 15 Process Round), before any review or Tournament History calls, so under the current policy a user hits 429 partway through a single Tournament.

The Instant Simulation endpoint keeps `TournamentPolicy` exactly as it is.

## Answer

### Policies

Two new policies sit beside `TournamentPolicy`. Every policy has its own per-IP counters, so the new endpoints never spend the Instant Simulation's budget. An action-level `[EnableRateLimiting]` overrides the controller-level one, so the new actions name their policy and `GET statistics` keeps `TournamentPolicy`.

| Policy | Endpoints | Limit | Queue |
|---|---|---|---|
| `TournamentPolicy` | Instant Simulation: `GET statistics` | 10 per minute | 5 (unchanged) |
| `StartTournamentPolicy` | Start: `POST /pokemon/tournament` | 10 per minute | 0 |
| `RoundByRoundPolicy` | Process Round and every new GET (Tournament, Round, Battle, Tournament History) | 60 per minute | 0 |

All three keep the current shape: a fixed window, partitioned by client IP.

- **Why the split**: Start is the only new endpoint that calls PokéAPI (16 requests, as the Instant Simulation does) and the only one that grows memory, since Tournaments never expire. So Start gets the Instant Simulation's limit. Process Round and the GETs only touch memory: 60 per minute is one request per second sustained, which is far above what a person clicking through a Tournament needs and still caps a flood.
- **Start queue of 0**: the 11th Start in a minute gets an immediate 429, instead of a spinner and an open connection for up to a minute. Only abuse ever reaches that point.

### 429 response

The body stays empty, as the Instant Simulation's is today: no `OnRejected` handler. This is the one exception to the `{ error }` body from [New endpoints contract](01-new-endpoints-contract.md), because the rejection comes from the middleware, not the controller. The frontend maps the 429 status to its own message, as `TournamentComponent.getErrorMessage` already does.

### Configuration

The numbers move out of `Program.cs` into `appsettings.json`, for all three policies. `TournamentPolicy` moves with its current values, so its behaviour is unchanged. Each policy's section is keyed by its policy name:

```json
"RateLimiting": {
  "TournamentPolicy":      { "PermitLimit": 10, "WindowSeconds": 60, "QueueLimit": 5 },
  "StartTournamentPolicy": { "PermitLimit": 10, "WindowSeconds": 60, "QueueLimit": 0 },
  "RoundByRoundPolicy":    { "PermitLimit": 60, "WindowSeconds": 60, "QueueLimit": 0 }
}
```

- The window type (fixed) and the partition (client IP) stay in code; only these three numbers are configurable.
- The numbers live only in `appsettings.json`, with no fallback defaults in code. A missing or invalid section makes the API fail at startup.
