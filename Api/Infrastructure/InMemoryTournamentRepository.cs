using System.Collections.Concurrent;
using Api.Application;
using Api.Domain;

namespace Api.Infrastructure;

/// <summary>
/// Holds Tournaments in memory, keyed by id, until the API restarts. Registered as a singleton.
/// </summary>
public class InMemoryTournamentRepository : ITournamentRepository
{
    private readonly ConcurrentDictionary<Guid, Tournament> _tournaments = new();

    /// <summary>
    /// Stores a new Tournament.
    /// </summary>
    /// <param name="tournament">The Tournament to store</param>
    /// <exception cref="InvalidOperationException">When a Tournament with the same id is already stored</exception>
    public void Add(Tournament tournament)
    {
        if (!_tournaments.TryAdd(tournament.Id, tournament))
            throw new InvalidOperationException($"Tournament {tournament.Id} is already stored.");
    }

    /// <summary>
    /// Gets a Tournament by id.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <returns>The Tournament, or null when none is held under that id</returns>
    public Tournament? Get(Guid id)
    {
        return _tournaments.GetValueOrDefault(id);
    }

    /// <summary>
    /// Lists every stored Tournament.
    /// </summary>
    /// <returns>All Tournaments, in no particular order</returns>
    public IReadOnlyCollection<Tournament> GetAll()
    {
        return _tournaments.Values.ToList();
    }
}
