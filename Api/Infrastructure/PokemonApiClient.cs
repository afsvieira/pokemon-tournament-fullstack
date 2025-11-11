using Api.Domain;
using Api.Dtos;

namespace Api.Infrastructure;

/// <summary>
/// Client responsible for fetching Pokémon data from the external PokéAPI.
/// </summary>
public class PokemonApiClient
{
    private readonly HttpClient _httpClient;

    public PokemonApiClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://pokeapi.co/api/v2/pokemon/");
    }

    /// <summary>
    /// Fetches a random selection of Pokémon from the PokéAPI.
    /// </summary>
    /// <param name="count">Number of unique Pokémon to fetch</param>
    /// <returns>List of Pokémon with basic attributes</returns>
    public async Task<List<TournamentPokemon>> FetchRandomPokemonsAsync(int count = 16)
    {
        var selectedIds = GenerateUniqueRandomIds(count, 1, 151);
        var tasks = selectedIds.Select(id => _httpClient.GetFromJsonAsync<PokemonResponseDto>($"{id}")).ToArray();
        var results = await Task.WhenAll(tasks);

        var pokemons = new List<TournamentPokemon>();

        foreach (var pokemonDetails in results)
        {
            if (pokemonDetails == null) continue;

            var primaryType = pokemonDetails.Types.FirstOrDefault(t => t.Slot == 1)?.Type.Name ?? "unknown";

            pokemons.Add(new TournamentPokemon
            {
                Id = pokemonDetails.Id,
                Name = pokemonDetails.Name,
                Type = primaryType,
                BaseExperience = pokemonDetails.Base_Experience,
                ImageUrl = pokemonDetails.Sprites.Front_Default
            });
        }

        return pokemons;
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
}
