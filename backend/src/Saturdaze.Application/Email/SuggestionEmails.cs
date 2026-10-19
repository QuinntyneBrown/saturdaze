namespace Saturdaze.Application.Email;

/// <summary>Mail about a family's event suggestion (L2-149).</summary>
public static class SuggestionEmails
{
    /// <summary>The wording for a rejection with no reason, shared with the card.</summary>
    public const string NoReason = "No reason was given.";

    public static EmailMessage NotAdded(string to, string title, string? reason) => new(
        to,
        $"Your suggestion \"{title}\" was not added",
        $"""
        Thanks for suggesting {title}. It was not added to Saturdaze this time.

        {(string.IsNullOrWhiteSpace(reason) ? NoReason : reason.Trim())}

        You can dismiss it from Ideas, Events whenever you like.
        """);
}
