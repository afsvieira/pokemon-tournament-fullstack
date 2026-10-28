# Rate limit for the new endpoints

Type: grilling
Status: open
Map: [Round-by-round Tournament](../map.md)

## Question

Which rate limit applies to the new endpoints?

`TournamentPolicy` (10 requests per minute per IP, queue of 5, rejections answered 429) is applied to the whole `TournamentController` in `Api/Program.cs`. One full Tournament takes 16 requests (Start plus 15 Process Round), before any review or Tournament History calls, so under the current policy a user hits 429 partway through a single Tournament.

The Instant Simulation endpoint keeps `TournamentPolicy` exactly as it is.
