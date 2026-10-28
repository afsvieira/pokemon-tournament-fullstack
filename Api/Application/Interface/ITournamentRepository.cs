using Api.Domain;

namespace Api.Application;

/// <summary>
/// Holds Tournaments for as long as the API runs. Tournaments are never removed and never expire.
/// </summary>
public interface ITournamentRepository
{
    /// <summary>
    /// Stores a new Tournament.
    /// </summary>
    /// <param name="tournament">The Tournament to store</param>
    void Add(Tournament tournament);

    /// <summary>
    /// Gets a Tournament by id.
    /// </summary>
    /// <param name="id">The Tournament's id</param>
    /// <returns>The Tournament, or null when none is held under that id</returns>
    Tournament? Get(Guid id);

    /// <summary>
    /// Lists every stored Tournament.
    /// </summary>
    /// <returns>All Tournaments, in no particular order</returns>
    IReadOnlyCollection<Tournament> GetAll();
}
