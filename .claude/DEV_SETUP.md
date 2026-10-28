# Dev setup

There is no `.sln`: pass the project path to `dotnet`.

```bash
dotnet run --project Api        # http://localhost:5268, Swagger at /swagger
dotnet test Api.Tests
dotnet test Api.Tests --filter "FullyQualifiedName~RateLimitingTests"

cd frontend && npm ci
npm start                       # http://localhost:4200
npx ng test --watch=false --browsers=ChromeHeadless
npx ng test --watch=false --browsers=ChromeHeadless --include src/app/pages/tournament/tournament.component.spec.ts
```

`npm test` runs Karma in watch mode with a visible Chrome; the headless flags above give a single run.

Karma needs Chrome: set `CHROME_BIN` when no system Chrome is installed. On Ubuntu 23.10+ headless Chrome can abort with "No usable sandbox"; point `CHROME_BIN` at a wrapper script that runs Chrome with `--no-sandbox`.

The running API calls the live PokéAPI, so the endpoint needs network access. Tests fake PokéAPI and run offline.
