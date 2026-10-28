using Api.Application;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace Api.Tests;

/// <summary>
/// Builds the API under test through the real HTTP pipeline, with PokéAPI replaced by a fake client
/// so tests never touch the network.
/// </summary>
internal static class TestApi
{
    /// <summary>
    /// Route of the round-by-round Tournament endpoints.
    /// </summary>
    public const string TournamentUrl = "/pokemon/tournament";

    /// <summary>
    /// Creates the API with a fake PokéAPI that returns <see cref="TestPokemon.SixteenIds"/>, as new objects on every call.
    /// </summary>
    /// <returns>A fresh app, so rate limiters and stored Tournaments start empty</returns>
    public static WebApplicationFactory<Program> CreateWithSixteenPokemon()
    {
        var pokemonApiClient = new Mock<IPokemonApiClient>();
        pokemonApiClient
            .Setup(client => client.FetchRandomPokemonsAsync(It.IsAny<int>()))
            .ReturnsAsync(() => TestPokemon.FromIds(TestPokemon.SixteenIds));

        return Create(pokemonApiClient.Object);
    }

    /// <summary>
    /// Creates the API with the given fake PokéAPI client.
    /// </summary>
    /// <param name="pokemonApiClient">The fake that stands in for PokéAPI</param>
    /// <returns>A fresh app, so rate limiters and stored Tournaments start empty</returns>
    public static WebApplicationFactory<Program> Create(IPokemonApiClient pokemonApiClient)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services.AddSingleton(pokemonApiClient)));
    }
}
