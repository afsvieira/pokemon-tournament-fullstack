using Api.Application;
using Api.Domain;
using Api.Dtos;
using Microsoft.Extensions.Caching.Memory;

namespace Api.Infrastructure;

/// <summary>
/// Client responsible for fetching Pokémon data from the external PokéAPI.
/// Each Pokémon's data is cached in memory by id after its first successful fetch, as PokéAPI's fair use policy asks.
/// </summary>
public class PokemonApiClient : IPokemonApiClient
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;

    /// <summary>
    /// Creates the client on top of the typed <see cref="HttpClient"/> and the app-wide memory cache.
    /// </summary>
    /// <param name="httpClient">The HTTP client for PokéAPI, provided by the typed-client registration</param>
    /// <param name="cache">The singleton memory cache; the client itself is transient, so it can't hold the cache</param>
    public PokemonApiClient(HttpClient httpClient, IMemoryCache cache)
    {
        _httpClient = httpClient;
        _cache = cache;
        _httpClient.BaseAddress = new Uri("https://pokeapi.co/api/v2/pokemon/");
    }

    /// <summary>
    /// Fetches a random selection of Pokémon, from the cache when already seen and from the PokéAPI otherwise.
    /// </summary>
    /// <param name="count">Number of unique Pokémon to fetch</param>
    /// <returns>New Pokémon objects with basic attributes, safe for the caller to change</returns>
    public async Task<List<TournamentPokemon>> FetchRandomPokemonsAsync(int count)
    {
        var selectedIds = GenerateUniqueRandomIds(count, 1, 151);
        var snapshots = await Task.WhenAll(selectedIds.Select(FetchSnapshotAsync));

        // Null responses are skipped. Fresh objects on every call: tournaments mutate them,
        // and the cached snapshots must stay as PokéAPI sent them
        return snapshots.OfType<PokemonSnapshot>().Select(snapshot => snapshot.ToTournamentPokemon()).ToList();
    }

    private async Task<PokemonSnapshot?> FetchSnapshotAsync(int id)
    {
        var cacheKey = new PokemonCacheKey(id);
        if (_cache.TryGetValue(cacheKey, out PokemonSnapshot? cached))
            return cached;

        var pokemonDetails = await _httpClient.GetFromJsonAsync<PokemonResponseDto>($"{id}");
        if (pokemonDetails == null) return null;

        var snapshot = PokemonSnapshot.From(pokemonDetails);

        // Kanto data is static, so entries never expire; a restart clears them
        _cache.Set(cacheKey, snapshot);
        return snapshot;
    }

    private static HashSet<int> GenerateUniqueRandomIds(int count, int minId, int maxId)
    {
        var random = new Random();
        var selectedIds = new HashSet<int>();

        while (selectedIds.Count < count)
        {
            selectedIds.Add(random.Next(minId, maxId + 1));
        }

        return selectedIds;
    }

    /// <summary>
    /// Cache key for one Pokémon, typed so it can't collide with other entries in the shared memory cache.
    /// </summary>
    private readonly record struct PokemonCacheKey(int PokemonId);

    /// <summary>
    /// Immutable copy of the PokéAPI data the tournament uses for one Pokémon.
    /// </summary>
    private sealed record PokemonSnapshot(int Id, string Name, string Type, int BaseExperience, string? ImageUrl)
    {
        public static PokemonSnapshot From(PokemonResponseDto pokemonDetails) => new(
            pokemonDetails.Id,
            pokemonDetails.Name,
            pokemonDetails.Types.FirstOrDefault(t => t.Slot == 1)?.Type.Name ?? "unknown",
            pokemonDetails.Base_Experience,
            pokemonDetails.Sprites.Front_Default);

        public TournamentPokemon ToTournamentPokemon() => new()
        {
            Id = Id,
            Name = Name,
            Type = Type,
            BaseExperience = BaseExperience,
            ImageUrl = ImageUrl
        };
    }
}
