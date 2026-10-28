namespace Api.Application;

/// <summary>
/// Thrown when the 16 Pokémon a Tournament needs can't be fetched: PokéAPI failed or returned fewer than 16.
/// </summary>
public class PokemonUnavailableException : Exception
{
    /// <summary>
    /// Creates the exception with a message for the log.
    /// </summary>
    /// <param name="message">What went wrong, for the log only</param>
    /// <param name="innerException">The PokéAPI failure, when there was one</param>
    public PokemonUnavailableException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
