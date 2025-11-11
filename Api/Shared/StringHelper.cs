namespace Api.Shared;

/// <summary>
/// Provides utility methods for string manipulation.
/// </summary>
public static class StringHelper
{
    /// <summary>
    /// Capitalizes the first letter of a string.
    /// </summary>
    /// <param name="text">The text to capitalize</param>
    /// <returns>The capitalized string, or the original if null/empty</returns>
    public static string Capitalize(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return text;

        return char.ToUpper(text[0]) + text.Substring(1);
    }
}
