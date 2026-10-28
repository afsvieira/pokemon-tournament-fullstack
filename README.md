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

### Endpoint

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
- **Type-Based Combat**: Implements Pokémon type advantage system
- **Statistics Calculation**: Automatic win rate calculation
- **Flexible Sorting**: Support for multiple sort fields and directions
- **Input Validation**: Rejects missing or unknown `sortBy` and unknown `sortDirection` with `400`
- **Rate Limiting**: Fixed window of 10 requests/minute per IP; up to 5 more requests wait for the next window, and anything beyond that is rejected
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
- **Total: 20 tests**

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
- App shell and theme toggle (4 tests)
- Tournament page (2 tests)
- Tournament service HTTP communication (2 tests)
- **Total: 22 tests**

## 🛠️ Development

### Project Structure

```
pokemon-tournament-fullstack/
├── .claude/skills/               # Claude Code agent skills used in this repo
├── Api/                          # .NET 10 Web API
│   ├── Controllers/              # HTTP endpoint and query validation
│   ├── Application/              # Tournament service and the interfaces it depends on
│   ├── Domain/                   # Battle rules, domain models and enums
│   ├── Infrastructure/           # PokéAPI HTTP client
│   ├── Dtos/                     # PokéAPI response shapes
│   ├── Shared/                   # String helpers
│   └── Program.cs                # DI, rate limiting, CORS, Swagger
├── Api.Tests/                    # xUnit test project
├── frontend/                     # Angular 18 application
│   └── src/app/
│       ├── components/           # Reusable UI components
│       ├── pages/                # Page components
│       ├── services/             # HTTP services
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

### Frontend Configuration

The frontend expects the API at `http://localhost:5268`. To change this, update the `apiUrl` in `frontend/src/app/services/tournament.service.ts`.

The API only accepts cross-origin requests from `http://localhost:4200`. If the frontend runs elsewhere, update the `AllowAngular` CORS policy in `Api/Program.cs`.

## 📊 Performance

- **API Response Time**: Usually well under a second; the 16 PokéAPI requests run in parallel
- **Battle Simulation**: 120 battles processed in <1ms
- **Re-sorting**: Changing the sort order re-sorts the loaded results in the browser without calling the API again
- **Bundle Size**: ~712 kB initial bundle in a production build (~148 kB transferred), including Bootstrap and Font Awesome

## 🚨 Error Handling

### API Errors
- **400 Bad Request**: Invalid parameters
- **503 Service Unavailable**: Rate limit exceeded and the queue is full (the rate limiter's default rejection status)
- **500 Internal Server Error**: Unexpected errors, including PokéAPI being unavailable

### Frontend Errors
- **Connection Errors**: Toast notifications (auto-hidden after 5 seconds) with a message based on the HTTP status
- **Loading States**: Spinners and disabled buttons

## 📝 Notes

- Pokémon data is fetched from PokéAPI (IDs 1-151, Kanto region only)
- Battle results are deterministic based on type and base experience
- All 16 Pokémon are guaranteed to be unique in each tournament
- Win rate is calculated as: (wins ÷ total battles) × 100

## 🤝 Contributing

This project was developed as a technical assessment. The code follows clean architecture principles and includes comprehensive testing for both backend and frontend components.