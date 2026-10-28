# Pokémon Tournament

Pokémon tournament simulator: ASP.NET Core API on .NET 10 (`Api/`, tests in `Api.Tests/`) + Angular 18 SPA (`frontend/`).

## Project context — read on demand

| Read when… | File |
|------------|------|
| Changing the API request flow, battle rules, the API–frontend contract, or a value shared across projects (port, CORS origin, rate limit, sort fields) | `.claude/ARCHITECTURE.md` |
| Building, running or testing locally (dotnet, npm, Karma with headless Chrome) | `.claude/DEV_SETUP.md` |

## Communication style

When reporting information to me, be extremely concise and sacrifice grammar for the sake of concision.

## Coding standards

All coding standards for this project live in the `coding-standards` skill at `.claude/skills/coding-standards/`.
**Load that skill** before writing code, reviewing changes, or answering questions about conventions.

## Language

Everything that goes into the code is in English: identifiers, comments, strings, log and error messages, test names, commit messages. So are the decision docs: specs, tickets, ADRs, `GLOSSARY.md`. This holds even when I write to you in Portuguese.

## Git workflow

Assessment V2 (round-by-round tournament, spec in `docs/assessment-v2.pdf`) is built on `feature/round-by-round-tournament`, branched from `main`: one commit per ticket, one PR to `main` at the end.

`/wayfinder` research findings are committed on this branch as `docs/research/<name>.md`, overriding the skill's throwaway `research/*` branches: push nothing until the PR, and the ticket's context pointer is that file path.

## Agent skills

### Issue tracker

Local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as `Status:` lines. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.
