# Pokémon Tournament Simulator

A full-stack application that simulates Pokémon battles in a tournament format, built with .NET 10 API and Angular 18 frontend.

## 🎯 Project Overview

This application fetches 16 random Pokémon from the first generation (Kanto region), simulates all-versus-all battles based on type advantages and base experience, then displays the results with comprehensive statistics and battle history.

## 🏗️ Architecture

- **Backend**: ASP.NET Core Web API (.NET 10) with controllers, split into Controllers, Application, Domain and Infrastructure layers
- **Frontend**: Angular 18 with standalone components
- **External API**: PokéAPI (https://pokeapi.co)
- **Styling**: Bootstrap 5 with custom SCSS
- **Testing**: xUnit + Moq (.NET) and Jasmine/Karma (Angular)

## 🚀 Quick Start

### Prerequisites

- .NET 10 SDK
- Node.js 18.19+, 20.11+ or 22+ and npm (Angular 18 requirement)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/afsvieira/pokemon-tournament-fullstack.git
cd pokemon-tournament-fullstack
```

### 2. Run the API

```bash
cd Api
dotnet restore
dotnet run
```

The API will be available at: `http://localhost:5268`
- Swagger UI: `http://localhost:5268/swagger`

### 3. Run the Frontend

```bash
cd frontend
npm install
npm start
```

The Angular app will be available at: `http://localhost:4200`

## 📋 API Documentation

The API has two flows: the **Instant Simulation** (`GET /pokemon/tournament/statistics`), which runs a whole tournament in one request, and the **round-by-round Tournament**, held in memory and played one Round at a time.

### Instant Simulation

**GET** `/pokemon/tournament/statistics`

### Query Parameters

| Parameter | Type | Required | Description | Default | Example |
|-----------|------|----------|-------------|---------|---------|
| `sortBy` | string | Yes | Field to sort by: `wins`, `losses`, `ties`, `name`, `id` (case-insensitive) | N/A | `wins` |
| `sortDirection` | string | No | Sort direction: `asc`, `desc` (case-insensitive) | `asc` | `desc` |

Every request runs a brand-new tournament with a new random set of Pokémon; nothing is stored between requests.

### Example Request

```bash
GET http://localhost:5268/pokemon/tournament/statistics?sortBy=wins&sortDirection=desc
```

### Example Response

```json
[
  {
    "id": 1,
    "name": "Bulbasaur",
    "type": "grass",
    "baseExperience": 64,
    "imageUrl": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
    "wins": 8,
    "losses": 5,
    "ties": 2,
    "winRate": 53.33,
    "battleRecords": [
      {
        "opponentName": "Charmander",
        "opponentType": "fire",
        "result": "Loss"
      }
    ]
  }
]
```

**Note:** The `result` field returns string values: `"Win"`, `"Loss"`, or `"Tie"`.

### Example Error Response

Invalid or missing parameters return `400 Bad Request` with an error message:

```json
{ "error": "sortBy parameter is required" }
```

### Round-by-round Tournament

Tournaments are kept in memory until the API restarts; they never expire.

| Verb | Route | Success | Rate limit |
|------|-------|---------|------------|
| POST | `/pokemon/tournament` | `201`, `Location: /pokemon/tournament/{id}`, the Tournament | `StartTournamentPolicy` |
| GET | `/pokemon/tournament/{id}` | `200`, the Tournament | `RoundByRoundPolicy` |
| POST | `/pokemon/tournament/{id}/rounds` | `201`, `Location: /pokemon/tournament/{id}/rounds/{roundNumber}`, the processed Round | `RoundByRoundPolicy` |
| GET | `/pokemon/tournament/{id}/rounds/{roundNumber}` | `200`, the Round | `RoundByRoundPolicy` |
| GET | `/pokemon/tournament/{id}/battles/{battleId}` | `200`, the Battle | `RoundByRoundPolicy` |

**Start** (`POST /pokemon/tournament`) takes no body, picks 16 random Pokémon and returns the new Tournament, every Pokémon at 0 wins, losses and ties:

```json
{
  "id": "3f2b8c1e-4d5a-4b6c-8e7f-9a0b1c2d3e4f",
  "startedAt": "2026-10-28T14:02:00+00:00",
  "roundsPlayed": 0,
  "standings": [
    {
      "id": 25,
      "name": "Pikachu",
      "type": "electric",
      "baseExperience": 112,
      "imageUrl": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
      "wins": 0,
      "losses": 0,
      "ties": 0,
      "winRate": 0
    }
  ]
}
```

`startedAt` is UTC. `standings` holds all 16 Pokémon in Start order, the order they were picked in, without `battleRecords`.

When PokéAPI fails or returns fewer than 16 Pokémon, Start answers `502 Bad Gateway` and stores nothing:

```json
{ "error": "Could not start a tournament right now. Try again later." }
```

A well-formed id the API doesn't hold (for example after a restart) answers `404 Not Found`:

```json
{ "error": "Tournament not found." }
```

An id that isn't a Guid matches no route and answers `404` with an empty body.

**Process Round** (`POST /pokemon/tournament/{id}/rounds`) takes no body: the API plays the next of the 15 Rounds. The 16 Pokémon are paired with the circle method over the Start order, so over 15 Rounds every Pokémon meets every other exactly once, and each Battle is decided by the Battle Rules below. It returns the Round's 8 Battles and the updated Standings:

```json
{
  "roundNumber": 1,
  "battles": [
    {
      "id": 1,
      "roundNumber": 1,
      "pokemon1": { "id": 25, "name": "Pikachu", "type": "electric", "baseExperience": 112, "imageUrl": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" },
      "pokemon2": { "id": 7, "name": "Squirtle", "type": "water", "baseExperience": 63, "imageUrl": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png" },
      "winnerId": 25
    }
  ],
  "standings": [
    { "id": 25, "name": "Pikachu", "type": "electric", "baseExperience": 112, "imageUrl": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png", "wins": 1, "losses": 0, "ties": 0, "winRate": 100 }
  ]
}
```

- Battle ids run 1–120 within the Tournament, in play order: Round r holds Battles 8(r−1)+1 … 8r.
- `pokemon1` is whichever Pokémon comes first in the Start order; `winnerId` is `null` on a tie.
- Simultaneous calls on the same Tournament are processed one after another, so Round numbers are never duplicated or skipped.
- Once all 15 Rounds are played, the Tournament is Complete and Process Round answers `409 Conflict`:

```json
{ "error": "Tournament is already complete." }
```

**Get a Round** (`GET /pokemon/tournament/{id}/rounds/{roundNumber}`) returns a played Round as `{ roundNumber, battles }`. A Round outside 1–15 or not yet played answers `404` with `{ "error": "Round not found." }`.

**Get a Battle** (`GET /pokemon/tournament/{id}/battles/{battleId}`) returns a played Battle as `{ id, roundNumber, pokemon1, pokemon2, winnerId }`, the shape it has in its Round. A Battle outside 1–120 or not yet played answers `404` with `{ "error": "Battle not found." }`.

## ⚔️ Battle Rules

### Type Advantages
- Water beats Fire
- Fire beats Grass  
- Grass beats Electric
- Electric beats Water
- Ghost beats Psychic
- Psychic beats Fighting
- Fighting beats Dark
- Dark beats Ghost

Only each Pokémon's primary type (slot 1 in PokéAPI) is used.

### Tie-Breaking Rules
1. If no type advantage exists, the Pokémon with higher base experience wins
2. If base experience is equal, the battle results in a tie

## 🎮 Features

### Frontend Features
- **Navigation**: Switch between the Instant Simulation (`/tournament`) and Round by Round (`/round-by-round`)
- **Round by Round**: Start a Tournament and open its page (`/round-by-round/:id`), then press Process Round to play its 15 Rounds one at a time. Each Round lists its 8 Battles, who fought whom and who won, and the Standings cards update and sort locally. A row of Round chips reopens any played Round while the cards keep the current Standings, and clicking a Battle opens it in a modal with both Pokémon and the winner, or Tie. Reopening the page shows the last played Round; after Round 15 a Complete badge replaces the button. A Tournament the API no longer holds shows a page explaining that Tournaments live in memory until the API restarts, with links to the Tournament History and to start a new one
- **Tournament Generation**: Fetch and simulate battles for 16 random Pokémon
- **Dynamic Sorting**: Sort results by wins, losses, ties, name, or ID
- **Battle History**: View detailed battle records for each Pokémon
- **Battle Rules**: In-app modal explaining type advantages and tie-breaking
- **Dark/Light Theme**: Toggle between themes (dark by default)
- **Responsive Design**: Optimized for desktop and mobile devices
- **Error Handling**: User-friendly error messages with toast notifications
- **Loading States**: Visual feedback during API calls

### Backend Features
- **Tournament Simulation**: Complete round-robin tournament (120 battles total)
- **Round-by-round Tournaments**: Started with 16 random Pokémon, played one Round at a time on a circle-method schedule, and held in memory until the API restarts
- **Type-Based Combat**: Implements Pokémon type advantage system
- **Statistics Calculation**: Automatic win rate calculation
- **Flexible Sorting**: Support for multiple sort fields and directions
- **Input Validation**: Rejects missing or unknown `sortBy` and unknown `sortDirection` with `400`
- **PokéAPI Cache**: Each Pokémon's data is cached in memory after its first fetch, as PokéAPI's [fair use policy](https://pokeapi.co/docs/v2) asks; the 16 Pokémon are still drawn at random on every call
- **Rate Limiting**: Fixed windows per IP, each policy with its own counters, rejecting with `429`. The numbers are set in configuration (see [Rate Limit Configuration](#rate-limit-configuration)):
  - `TournamentPolicy`, the Instant Simulation: 10 requests/minute; up to 5 more wait for the next window
  - `StartTournamentPolicy`, Start: 10 requests/minute, no queue
  - `RoundByRoundPolicy`, every other round-by-round endpoint: 60 requests/minute, no queue
- **Error Handling**: Graceful error responses
- **CORS Support**: Configured for Angular frontend
- **API Documentation**: Swagger/OpenAPI integration

## 🧪 Testing

### Run API Tests

```bash
cd Api.Tests
dotnet test
```

**Test Coverage:**
- Battle logic and type advantages (10 tests)
- `TournamentPokemon` statistics and win rate (6 tests)
- Service input validation, with PokéAPI faked (4 tests)
- Round-by-round service operations, with PokéAPI and the clock faked: Start, the 15-Round schedule, Standings, Complete, parallel Process Round and unknown Tournaments, Rounds and Battles (11 tests)
- Round-by-round endpoints through the real HTTP pipeline (18 tests)
- Rate limiting and its configuration through the real HTTP pipeline (9 tests)
- PokéAPI client and its cache, with PokéAPI stubbed (4 tests)
- **Total: 62 tests**

### Run Frontend Tests

```bash
cd frontend
npm test
```

`npm test` opens Chrome and re-runs on file changes. For a single headless run:

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

**Test Coverage:**
- UI components: pokemon card (6), sort controls (5), battle history modal (2), rules modal (1)
- App shell, navigation and theme toggle (5 tests)
- Tournament page, including the rate-limit error message (3 tests)
- Tournament History page, through the app routes: Start and its error toast (2 tests)
- Round-by-round Tournament page, through the app routes: Standings, sorting, load error and Retry, the "no longer exists" page with its two actions, Process Round with its errors, the Round chips and the Battle modal (20 tests)
- Tournament service HTTP communication (2 tests)
- **Total: 46 tests**

## 🛠️ Development

### Project Structure

```
pokemon-tournament-fullstack/
├── .claude/skills/               # Claude Code agent skills used in this repo
├── Api/                          # .NET 10 Web API
│   ├── Controllers/              # HTTP endpoint and query validation
│   ├── Application/              # Tournament service and the interfaces it depends on
│   ├── Domain/                   # Battle rules, domain models and enums
│   ├── Infrastructure/           # PokéAPI HTTP client and its cache, in-memory Tournament repository
│   ├── Dtos/                     # PokéAPI response shapes and round-by-round response bodies
│   ├── Shared/                   # String helpers, rate-limit policy names and setup
│   └── Program.cs                # DI, rate limiting, CORS, Swagger
├── Api.Tests/                    # xUnit test project
├── frontend/                     # Angular 18 application
│   └── src/app/
│       ├── components/           # Reusable UI components
│       ├── pages/                # Page components
│       ├── services/             # HTTP services and the shared API base URL
│       ├── shared/               # Error messages and shared styles
│       ├── testing/              # Test data shared by specs
│       └── models/               # API models, enums and display mappings
└── README.md
```

### Key Technologies

**Backend:**
- ASP.NET Core 10 Web API with controllers
- System.Text.Json for serialization (enums as strings)
- Typed HttpClient for external API calls
- Swashbuckle for Swagger/OpenAPI
- xUnit and Moq for testing

**Frontend:**
- Angular 18 with standalone components
- Bootstrap 5 for styling
- Bootstrap Icons and Font Awesome for icons
- RxJS for reactive programming
- Jasmine/Karma for testing

## 🔧 Configuration

### API Configuration

The API runs on `http://localhost:5268` by default. To change the port, modify `Api/Properties/launchSettings.json`.

### Rate Limit Configuration

The rate-limit numbers live in the `RateLimiting` section of `Api/appsettings.json`, one sub-section per policy:

```json
"RateLimiting": {
  "TournamentPolicy": { "PermitLimit": 10, "WindowSeconds": 60, "QueueLimit": 5 },
  "StartTournamentPolicy": { "PermitLimit": 10, "WindowSeconds": 60, "QueueLimit": 0 },
  "RoundByRoundPolicy": { "PermitLimit": 60, "WindowSeconds": 60, "QueueLimit": 0 }
}
```

- `PermitLimit`: requests allowed per window and client IP (1 or more)
- `WindowSeconds`: length of the fixed window, in seconds (1 or more)
- `QueueLimit`: requests that wait for the next window once the permits are spent (0 or more)

There are no defaults in code: the API refuses to start, naming the section, when a sub-section or one of its keys is missing or out of range. The fixed-window type and the per-IP partition are set in code.

### Frontend Configuration

The frontend expects the API at `http://localhost:5268`. To change this, update `API_BASE_URL` in `frontend/src/app/services/api-base-url.ts`.

The API only accepts cross-origin requests from `http://localhost:4200`. If the frontend runs elsewhere, update the `AllowAngular` CORS policy in `Api/Program.cs`.

## 📊 Performance

- **API Response Time**: Usually well under a second; PokéAPI is only called for Pokémon not yet cached, and those requests run in parallel. Once all 151 are cached, a call never reaches PokéAPI
- **Battle Simulation**: 120 battles processed in <1ms
- **Re-sorting**: Changing the sort order re-sorts the loaded results in the browser without calling the API again
- **Bundle Size**: ~712 kB initial bundle in a production build (~148 kB transferred), including Bootstrap and Font Awesome

## 🚨 Error Handling

### API Errors
- **400 Bad Request**: Invalid parameters
- **404 Not Found**: A Tournament the API doesn't hold (`{ "error": "Tournament not found." }`), a Round not played yet (`{ "error": "Round not found." }`), a Battle not played yet (`{ "error": "Battle not found." }`), or a malformed id (empty body)
- **409 Conflict**: Process Round on a Complete Tournament
- **429 Too Many Requests**: Rate limit exceeded and the queue, if the policy has one, is full
- **502 Bad Gateway**: Start couldn't get 16 Pokémon from PokéAPI
- **500 Internal Server Error**: Unexpected errors, including PokéAPI being unavailable for a Pokémon not yet cached

### Frontend Errors
- **Connection Errors**: Toast notifications (auto-hidden after 5 seconds) with a message based on the HTTP status, including a rate-limit message for `429`
- **Round by Round**: a failed Start shows a toast with the API's `error` message, or one based on the status; a failed Process Round or Round chip shows a toast and leaves the page as it was; a Battle that fails to load shows the message inside its modal; a Tournament page that fails to load shows the message inline with a Retry button. Any `404` on the Tournament page shows that the Tournament no longer exists, and a `409` on Process Round (another tab completed the Tournament) reloads the page before showing the API's message
- **Loading States**: Spinners and disabled buttons

## 📝 Notes

- Pokémon data is fetched from PokéAPI (IDs 1-151, Kanto region only) and cached in memory until the API restarts
- Battle results are deterministic based on type and base experience
- All 16 Pokémon are guaranteed to be unique in each tournament
- Win rate is calculated as: (wins ÷ total battles) × 100

## 🤝 Contributing

This project was developed as a technical assessment. The code follows clean architecture principles and includes comprehensive testing for both backend and frontend components.