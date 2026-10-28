# 10: A Tournament that no longer exists

**Spec:** [Round-by-round Tournament](../spec.md)

**What to build:** Opening a Tournament the API doesn't hold shows a page that explains why and offers a way forward. That happens after an API restart, with a stale link or with a malformed id in the URL. Later tickets send every 404 on the Tournament page here.

**Blocked by:** 09 (Start a Tournament and see its 16 Pokémon).

**Status:** ready-for-agent

- [ ] `GET /pokemon/tournament/{id}` with a well-formed Guid the API doesn't hold answers 404 `{ "error": "Tournament not found." }`.
- [ ] A malformed id matches no route and answers 404 with an empty body.
- [ ] The service reports an unknown Tournament distinctly, so the controller can map it to 404.
- [ ] On the Tournament page, a 404 replaces the whole page with "This Tournament no longer exists. Tournaments are kept in memory only until the API restarts.", plus a [Tournament History] link and a [Start Tournament] button.
- [ ] The 404 handling is shared within the Tournament page, so Process Round, Round chips and the Battle modal can route their 404s here.
- [ ] Tests:
  - Service seam: an unknown Tournament is reported.
  - HTTP seam: both 404s.
  - Routed-pages seam: the page appears for a 404, and both of its actions work.
