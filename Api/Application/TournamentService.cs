using Api.Domain;
using Api.Dtos;

namespace Api.Application;

/// <summary>
/// Provides functionality to simulate Pokémon tournaments,
/// including fetching data from the external API, running battles,
/// and returning sorted statistics.
/// </summary>
public class TournamentService : ITournamentService
{
    private readonly HttpClient _httpClient;
    // Defines basic type advantages for battle comparison.
    // The dictionary structure allows easy extension to include additional Pokémon types if needed.
    private readonly Dictionary<string, string> _typeAdvantages = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        {"water", "fire"},
        {"fire", "grass"},
        {"grass", "electric"},
        {"electric", "water"},
        {"ghost", "psychic"},
        {"psychic", "fighting"},
        {"fighting", "dark"},
        {"dark", "ghost"}
    };

    public TournamentService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://pokeapi.co/api/v2/pokemon/");
    }

    /// <summary>
    /// Executes the full tournament process: fetches Pokémon, simulates battles,
    /// and returns sorted statistics based on the given criteria.
    /// </summary>
    /// <param name="sortBy">The field used for sorting (e.g., wins, losses, name, etc.).</param>
    /// <param name="sortDirection">The direction of sorting (asc or desc, default is asc).</param>
    /// <returns>A collection of Pokémon with calculated battle statistics.</returns>
    public async Task<IEnumerable<TournamentPokemon>> GetTournamentStatistics(string sortBy, string sortDirection = "asc")
    {

        // Step 1: Fetch 16 random Pokémon from API
        var pokemons = await FetchPokemonsFromApi();

        // Step 2: Run all-versus-all battles
        SimulateBattles(pokemons);

        // Step 3: Sort results before returning
        var ordered = SortPokemons(pokemons, sortBy, sortDirection);

        return ordered;

    }

    // Retrieves a random list of Pokémon (default: 16 unique IDs between 1 and 151)
    private async Task<List<TournamentPokemon>> FetchPokemonsFromApi(int count = 16)
    {
        var random = new Random();
        var selectedIds = new HashSet<int>();

        // Ensures unique Pokémon IDs within the selected range
        while (selectedIds.Count < count)
        {
            selectedIds.Add(random.Next(1, 152));
        }

        var pokemons = new List<TournamentPokemon>();

        foreach (var id in selectedIds)
        {
            // Fetch Pokémon details from the API
            var pokemonDetails = await _httpClient.GetFromJsonAsync<PokemonResponseDto>($"{id}");
            
            if (pokemonDetails == null) continue;

            // Use the primary type (slot = 1)
            var primaryType = pokemonDetails.Types.FirstOrDefault(t => t.Slot == 1)?.Type.Name ?? "unknown";

            // Create a simplified model for tournament statistics
            pokemons.Add(new TournamentPokemon
            {
                Id = pokemonDetails.Id,
                Name = Capitalize(pokemonDetails.Name),
                Type = primaryType,
                BaseExperience = pokemonDetails.Base_Experience,
                ImageUrl = pokemonDetails.Sprites.Front_Default
            });
        }

        return pokemons;

    }

    // Capitalizes Pokémon names for better presentation
    private static string Capitalize(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return name;

        return char.ToUpper(name[0]) + name.Substring(1);
    }

    // Simulates all-versus-all battles between Pokémon and registers results
    private void SimulateBattles(List<TournamentPokemon> pokemons)
    {
        for (int i = 0; i < pokemons.Count; i++)
        {
            for (int j = i + 1; j < pokemons.Count; j++)
            {
                var p1 = pokemons[i];
                var p2 = pokemons[j];

                // Determine who wins between the two
                var resultForP1 = DetermineBattleOutcome(p1, p2);

                // Register the result for both Pokémon
                switch (resultForP1)
                {
                    case BattleOutcomeEnum.Win:
                        p1.BattleRegister(p2, BattleOutcomeEnum.Win);
                        p2.BattleRegister(p1, BattleOutcomeEnum.Loss);
                        break;
                    case BattleOutcomeEnum.Loss:
                        p1.BattleRegister(p2, BattleOutcomeEnum.Loss);
                        p2.BattleRegister(p1, BattleOutcomeEnum.Win);
                        break;
                    case BattleOutcomeEnum.Tie:
                        p1.BattleRegister(p2, BattleOutcomeEnum.Tie);
                        p2.BattleRegister(p1, BattleOutcomeEnum.Tie);
                        break;
                }

            }
        }
    }

    // Determines the winner based on type advantages or base experience (tie-breaker)
    private BattleOutcomeEnum DetermineBattleOutcome(TournamentPokemon p1, TournamentPokemon p2)
    {
        var type1 = p1.Type.ToLower();
        var type2 = p2.Type.ToLower();

        if (_typeAdvantages.ContainsKey(type1) && _typeAdvantages[type1] == type2)
            return BattleOutcomeEnum.Win;
        if (_typeAdvantages.ContainsKey(type2) && _typeAdvantages[type2] == type1)
            return BattleOutcomeEnum.Loss;

        if (p1.BaseExperience > p2.BaseExperience)
            return BattleOutcomeEnum.Win;

        if (p1.BaseExperience < p2.BaseExperience)
            return BattleOutcomeEnum.Loss;

        return BattleOutcomeEnum.Tie;
    }

    // Sorts the Pokémon list based on the selected field and direction
    private IEnumerable<TournamentPokemon> SortPokemons(List<TournamentPokemon> pokemons, string sortBy, string direction)
    {
        if (string.IsNullOrWhiteSpace(sortBy))
            throw new ArgumentException("sortBy parameter cannot be null or empty", nameof(sortBy));

        Func<TournamentPokemon, object> keySelector = sortBy.ToLower() switch
        {
            "wins" => p => p.Wins,
            "losses" => p => p.Losses,
            "ties" => p => p.Ties,
            "name" => p => p.Name,
            "id" => p => p.Id,
            _ => throw new ArgumentException($"Invalid sortBy value: {sortBy}", nameof(sortBy))
        };

        var sorted = direction.Equals("asc", StringComparison.OrdinalIgnoreCase)
            ? pokemons.OrderBy(keySelector)
            : pokemons.OrderByDescending(keySelector);

        return sorted.ToList();
    }


}