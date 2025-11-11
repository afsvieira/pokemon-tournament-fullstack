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
        var pokemons = await FetchPokemonsFromApi();
        SimulateBattles(pokemons);
        return SortPokemons(pokemons, sortBy, sortDirection);
    }

    private async Task<List<TournamentPokemon>> FetchPokemonsFromApi(int count = 16)
    {
        var random = new Random();
        var selectedIds = new HashSet<int>();

        while (selectedIds.Count < count)
        {
            selectedIds.Add(random.Next(1, 152));
        }

        var tasks = selectedIds.Select(id => _httpClient.GetFromJsonAsync<PokemonResponseDto>($"{id}")).ToArray();
        var pokemons = new List<TournamentPokemon>();
        var results = await Task.WhenAll(tasks);

        foreach (var pokemonDetails in results)
        {
            if (pokemonDetails == null) continue;

            var primaryType = pokemonDetails.Types.FirstOrDefault(t => t.Slot == 1)?.Type.Name ?? "unknown";

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

    private static string Capitalize(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return name;

        return char.ToUpper(name[0]) + name.Substring(1);
    }

    private void SimulateBattles(List<TournamentPokemon> pokemons)
    {
        for (int i = 0; i < pokemons.Count; i++)
        {
            for (int j = i + 1; j < pokemons.Count; j++)
            {
                var p1 = pokemons[i];
                var p2 = pokemons[j];
                var resultForP1 = DetermineBattleOutcome(p1, p2);

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