using System.Collections.Concurrent;
using System.Net;
using System.Text;
using Api.Domain;
using Api.Infrastructure;
using Microsoft.Extensions.Caching.Memory;

namespace Api.Tests;

/// <summary>
/// Tests for the PokéAPI client and its cache, with PokéAPI replaced by a stubbed HTTP message handler.
/// </summary>
public class PokemonApiClientTests
{
    private const int KantoPokemonCount = 151;

    /// <summary>
    /// Verifies that each Pokémon is requested from PokéAPI only once:
    /// fetching all 151 Kanto Pokémon twice sends 151 requests, not 302.
    /// </summary>
    [Fact]
    public async Task FetchRandomPokemonsAsync_ShouldRequestEachPokemonOnce_WhenFetchedTwice()
    {
        // Arrange
        var pokeApi = new StubPokeApiHandler();
        var client = CreateClient(pokeApi);

        // Act
        await client.FetchRandomPokemonsAsync(KantoPokemonCount);
        await client.FetchRandomPokemonsAsync(KantoPokemonCount);

        // Assert
        Assert.Equal(KantoPokemonCount, pokeApi.RequestedIds.Count);
        Assert.Equal(Enumerable.Range(1, KantoPokemonCount), pokeApi.RequestedIds.Order());
    }

    /// <summary>
    /// Verifies that the cache hands out fresh Pokémon on every call: renaming the returned Pokémon
    /// and registering battles on them, as a tournament does, leaves the next call's Pokémon untouched.
    /// </summary>
    [Fact]
    public async Task FetchRandomPokemonsAsync_ShouldReturnUntouchedPokemon_WhenEarlierResultsWereChanged()
    {
        // Arrange
        var client = CreateClient(new StubPokeApiHandler());
        var firstResult = await client.FetchRandomPokemonsAsync(KantoPokemonCount);
        foreach (var pokemon in firstResult)
        {
            pokemon.Name = "Changed";
            pokemon.BattleRegister(firstResult[0], BattleOutcomeEnum.Win);
        }

        // Act
        var secondResult = await client.FetchRandomPokemonsAsync(KantoPokemonCount);

        // Assert
        Assert.All(secondResult, pokemon =>
        {
            Assert.Equal($"pokemon-{pokemon.Id}", pokemon.Name);
            Assert.Equal(0, pokemon.Wins);
            Assert.Empty(pokemon.BattleRecords);
        });
    }

    /// <summary>
    /// Verifies that a Pokémon PokéAPI failed to deliver, with an error status or a null body,
    /// is not cached and is requested again on the next call.
    /// </summary>
    /// <param name="failedStatus">Status of PokéAPI's failed answer</param>
    /// <param name="failedBody">Body of PokéAPI's failed answer</param>
    [Theory]
    [InlineData(HttpStatusCode.InternalServerError, "")]
    [InlineData(HttpStatusCode.OK, "null")]
    public async Task FetchRandomPokemonsAsync_ShouldRequestPokemonAgain_WhenPokeApiFailedToDeliverIt(
        HttpStatusCode failedStatus, string failedBody)
    {
        // Arrange - Pikachu fails once, then PokéAPI recovers
        const int pikachuId = 25;
        var pokeApi = new StubPokeApiHandler();
        pokeApi.AnswerOnce(pikachuId, failedStatus, failedBody);
        var client = CreateClient(pokeApi);
        await Record.ExceptionAsync(() => client.FetchRandomPokemonsAsync(KantoPokemonCount));

        // Act
        var pokemons = await client.FetchRandomPokemonsAsync(KantoPokemonCount);

        // Assert
        Assert.Equal(2, pokeApi.RequestedIds.Count(id => id == pikachuId));
        Assert.Contains(pokemons, pokemon => pokemon.Id == pikachuId);
    }

    private static PokemonApiClient CreateClient(StubPokeApiHandler pokeApi)
    {
        return new PokemonApiClient(new HttpClient(pokeApi), new MemoryCache(new MemoryCacheOptions()));
    }

    /// <summary>
    /// Stands in for PokéAPI: answers <c>GET pokemon/{id}</c> with that Pokémon's data and records every requested id.
    /// </summary>
    private sealed class StubPokeApiHandler : HttpMessageHandler
    {
        private readonly ConcurrentQueue<int> _requestedIds = new();
        private readonly ConcurrentDictionary<int, (HttpStatusCode Status, string Body)> _oneOffAnswers = new();

        /// <summary>
        /// Every Pokémon id requested so far, one entry per request.
        /// </summary>
        public IReadOnlyCollection<int> RequestedIds => _requestedIds;

        /// <summary>
        /// Makes the next request for <paramref name="id"/> get this status and body instead of the Pokémon's data.
        /// </summary>
        public void AnswerOnce(int id, HttpStatusCode status, string body)
        {
            _oneOffAnswers[id] = (status, body);
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var id = int.Parse(request.RequestUri!.Segments.Last());
            _requestedIds.Enqueue(id);

            if (_oneOffAnswers.TryRemove(id, out var oneOff))
            {
                return Task.FromResult(new HttpResponseMessage(oneOff.Status)
                {
                    Content = new StringContent(oneOff.Body, Encoding.UTF8, "application/json")
                });
            }

            var json = $$"""
                {
                  "id": {{id}},
                  "name": "pokemon-{{id}}",
                  "base_experience": {{id + 50}},
                  "types": [{ "slot": 1, "type": { "name": "fire", "url": "" } }],
                  "sprites": { "front_default": "https://img.example/{{id}}.png" }
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            });
        }
    }
}
