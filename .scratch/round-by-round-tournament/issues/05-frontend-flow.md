# Round-by-round frontend flow

Type: grilling
Status: resolved
Blocked by: 01
Map: [Round-by-round Tournament](../map.md)

## Question

How does the frontend present the round-by-round flow?

- Routes and pages, and how they sit beside the Instant Simulation page (`/tournament`).
- The Start Tournament and Process Round controls, with all 16 Pokémon shown even at Start.
  The API processes simultaneous Process Round calls one after another, so a double click would advance two Rounds ([Tournament in memory](04-tournament-in-memory.md)); the control must prevent that.
- The Round view: which pairs fought and who won, with running Standings on the card grid (`PokemonCardComponent` today shows wins, losses, ties, win rate and a battle-history modal).
- Reviewing an earlier Round or a single Battle.
- The Tournament History view, and what opening one of its entries does.
- The typed service layer for the new endpoints.

Resolve with ASCII sketches, not a prototype.

## Answer

### Routes and navigation

- `/tournament` stays the Instant Simulation page, unchanged. The `''` and `**` redirects still point to it.
- `/round-by-round` is the Tournament History page, which also holds the Start Tournament button.
- `/round-by-round/:id` shows one Tournament.
- The app shell gets a small nav with two links, "Instant Simulation" and "Round by Round". The Instant Simulation page itself is not touched.
- Rejected:
  - Mirroring the API paths (`/tournament/history`, `/tournament/:id`): they clash with the Instant Simulation's `/tournament`.
  - `/tournaments`: one letter away from `/tournament`.

### Tournament History page (`/round-by-round`)

```
 Round by Round                                        [▶ Start Tournament]
 Tournament History
 ┌───────────────────┬──────────────┬────────┐
 │ Started           │ Rounds       │        │
 │ 28/10/2026 14:02  │ 15/15 ✔      │ [Open] │
 │ 28/10/2026 13:40  │ 7/15         │ [Open] │
 └───────────────────┴──────────────┴────────┘
 empty: "No Tournaments since the API last started."
```

- **Start Tournament**: calls Start, then navigates to `/round-by-round/:id`, where all 16 Pokémon show 0 wins, losses and ties.
- **Open**: navigates to the Tournament. A Tournament that is not Complete can be resumed: Process Round works from where it stopped.

### Tournament page (`/round-by-round/:id`)

```
 ← Tournament History
 Tournament · started 28/10 14:02            Round 3 of 15   [▶ Process Round]
 Rounds:  [1] [2] (3) [4·] [5·] … [15·]        · = not played yet, disabled
 ┌ Round 3 ─────────────────────────────────────────────────────┐
 │ Battle 17  ⚡ Pikachu 112   vs  💧 Squirtle 63    Pikachu wins │ ← click opens the Battle
 │ Battle 18  🪨 Onix 77       vs  🪨 Geodude 60     Onix wins    │
 │ Battle 19  🧠 Abra 62       vs  👻 Gastly 62      Tie          │
 │ … 8 rows                                                      │
 └──────────────────────────────────────────────────────────────┘
 Standings   Sort: [Wins ▼][Desc]
 ┌card┐ ┌card┐ ┌card┐ ┌card┐ …  16 PokemonCards (wins, losses, ties, win rate)
```

- **Loading**: the page always loads `GET {id}`, plus the last played Round when there is one. Coming from Start and reopening from the Tournament History take the same path.
- **Process Round**:
  - Shows the new Round, selects its chip and updates the cards from the returned Standings.
  - Disabled with a spinner while a request is in flight, which blocks double clicks ([Tournament in memory](04-tournament-in-memory.md)).
  - Replaced by a "✔ Complete" badge once the Tournament is Complete. That keeps the UI from triggering the 409 in normal use; the API keeps returning 409 for any client that calls Process Round on a Complete Tournament ([New endpoints contract](01-new-endpoints-contract.md)).
- **Round chips**: one per Round; the played ones are clickable. Clicking an earlier Round fetches `GET {id}/rounds/{roundNumber}` and keeps it in the component, since a played Round never changes.
- **Standings while reviewing**: the cards always show the current Standings, even while an earlier Round is selected.
- **Before Round 1**: the Round panel reads "No Rounds yet", and the cards show 0 wins, losses and ties.

### Battle review

Clicking a Battle row opens a modal filled by `GET {id}/battles/{battleId}`: both Pokémon (image, type, base experience) and the winner, or "Tie". There is no separate Battle route.

### Cards

- **Sorting**: the Standings reuse `SortControlsComponent`, sorted locally as on the Instant Simulation page, Wins descending by default.
- **"View Battles" button**: `PokemonCardComponent` gets an optional input that hides it on round-by-round pages. Its default keeps the button, so the Instant Simulation is unchanged. The Round view already shows the Battles; filling the modal would need every Round loaded.

### Typed service layer

- **Service**: `RoundByRoundService` in `services/round-by-round.service.ts`, with `startTournament`, `processRound`, `getTournament`, `getRound`, `getBattle` and `getHistory`.
- **Models**, one per file in `models/`:
  - `tournament.model.ts`;
  - `round.model.ts`, with `ProcessedRound` adding `standings`;
  - `battle.model.ts`, with `BattlePokemon` and `winnerId: number | null`;
  - `tournament-history-entry.model.ts`.
- **Standings entries**: reuse the existing `TournamentPokemon` model.
- **Base URL**: a shared `API_BASE_URL` constant (`http://localhost:5268/pokemon/tournament`), used by both `RoundByRoundService` and the Instant Simulation's `TournamentService`. That changes one line in `TournamentService`, with no change in behaviour.

### Left to Error experience in the new views

[Error experience in the new views](06-error-experience-in-new-views.md) decides how every error status is shown, including the 409 a stale second tab can still get.
