# 09: Start a Tournament and see its 16 Pokémon

**Spec:** [Round-by-round Tournament](../spec.md)

**What to build:** From a new "Round by Round" entry in the navigation, the user presses Start Tournament. The API creates a Tournament held in memory, and the user lands on that Tournament's page, where all 16 Pokémon appear at 0 wins, losses and ties.

**Blocked by:** 07 (Rate-limit numbers in configuration).

**Status:** ready-for-agent

**API**

- [x] `POST /pokemon/tournament` takes no body and answers 201 with `Location: /pokemon/tournament/{id}` and the Tournament.
- [x] The Tournament body is `{ id, startedAt, roundsPlayed, standings }`:
  - `id` is a Guid.
  - `startedAt` is UTC, taken from an injected `TimeProvider`; `TimeProvider.System` is registered.
  - `roundsPlayed` is 0.
  - `standings` holds 16 entries in Start order.
- [x] Each Standings entry is `{ id, name, type, baseExperience, imageUrl, wins, losses, ties, winRate }`, with capitalized names and no `battleRecords`.
- [x] `GET /pokemon/tournament/{id:guid}` answers 200 with the same Tournament shape.
- [x] Tournaments live in a singleton in-memory repository (`ITournamentRepository`, implemented by `InMemoryTournamentRepository`) and never expire.
- [x] Start fails with 502 `{ "error": "Could not start a tournament right now. Try again later." }` when PokéAPI fails or returns fewer than 16 Pokémon. Nothing is stored, and the details go only to the log.
- [x] The new operations are new methods on `ITournamentService` / `TournamentService`. `GetTournamentStatistics` is untouched. The existing validation tests are adjusted to the constructor's new dependencies.
- [x] Rate limits:
  - Start uses `StartTournamentPolicy`: 10 per minute, queue 0.
  - `GET {id}` uses `RoundByRoundPolicy`: 60 per minute, queue 0.
  - Both read their numbers from the `RateLimiting` configuration section.
  - Neither shares counters with `TournamentPolicy`.
- [x] The new actions carry XML doc comments and `ProducesResponseType` attributes.

**UI**

- [x] The app shell has a nav with "Instant Simulation" (`/tournament`) and "Round by Round" (`/round-by-round`). The Instant Simulation page and the existing redirects are unchanged.
- [x] `/round-by-round` shows a Start Tournament button with a spinner while the request runs. On success, it navigates to `/round-by-round/:id`.
- [x] `/round-by-round/:id` loads the Tournament and shows:
  - a link back to the Tournament History;
  - the start time and "Round 0 of 15";
  - a "No Rounds yet" Round panel;
  - the 16 Pokémon cards at 0 wins, losses and ties.
- [x] The cards are sorted locally with the sort controls, Wins descending by default.
- [x] The cards don't show "View Battles". A new optional card input hides it; its default keeps the button on the Instant Simulation page.
- [x] `RoundByRoundService` exposes `startTournament` and `getTournament`, with one model per file. A shared `API_BASE_URL` constant is used both by it and by the Instant Simulation's service.
- [x] A shared helper picks each error message: the API's `error` when the body has one, otherwise a fixed message by status (0, 429, 500 and above, anything else) in the Instant Simulation's wording.
- [x] A failed Start shows a toast from a new `ErrorToastComponent` and enables the button again.
- [x] A Tournament page that fails to load, other than with a 404, shows an inline panel with the message and a Retry button.

**Tests and docs**

- [x] Service seam (with `FakeTimeProvider` from the new `Microsoft.Extensions.TimeProvider.Testing` test dependency):
  - Start returns 16 Pokémon at 0 wins, losses and ties, and `startedAt` equals the fake clock's time.
  - With fewer than 16 Pokémon, Start fails and stores nothing.
- [x] HTTP seam:
  - Start's 201, `Location` and JSON shape.
  - `GET {id}` answers 200.
  - The 502 body.
  - Each new policy answers 429 at its own limit, independently of `TournamentPolicy`.
- [x] Routed-pages seam:
  - Start navigates to the Tournament page.
  - The page renders 16 cards without "View Battles".
  - A failed Start shows a toast.
  - A load failure shows the inline panel, and Retry reloads the page.
- [x] The README documents Start and `GET {id}` and their rate limits. The request flow in `.claude/ARCHITECTURE.md` includes the repository, and "Values that change together" lists the new policies and `API_BASE_URL`.
