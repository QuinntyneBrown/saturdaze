namespace Saturdaze.Domain.ValueObjects;

/// <summary>
/// The content themes a family can leave out and a catalog place can carry (L2-194).
/// A fixed vocabulary, so a family's choice and a place's tag always mean the same thing.
/// </summary>
public static class ContentThemes
{
    public const string Halloween = "halloween";
    public const string Christmas = "christmas";
    public const string Easter = "easter";
    public const string Valentines = "valentines";
    public const string Alcohol = "alcohol";
    public const string Horror = "horror";

    public static readonly IReadOnlyList<string> All =
        new[] { Halloween, Christmas, Easter, Valentines, Alcohol, Horror };

    public static bool IsKnown(string theme) => All.Contains(theme, StringComparer.OrdinalIgnoreCase);
}
