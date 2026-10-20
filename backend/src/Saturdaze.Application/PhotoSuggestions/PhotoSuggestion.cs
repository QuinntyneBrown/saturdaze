namespace Saturdaze.Application.PhotoSuggestions;

/// <summary>
/// One candidate photo after the API fetched, verified and cleaned it (L2-157): the bytes the
/// person may keep, the credit that goes with them, and the user the suggestion belongs to.
/// </summary>
public sealed record PhotoSuggestion(
    string Id,
    Guid UserId,
    byte[] Content,
    int Width,
    int Height,
    string Title,
    string SourceName,
    string SourceUrl,
    string Attribution,
    string Licence);

/// <summary>Short-lived, in-memory keeping of suggestions between the search and the person's choice.</summary>
public interface IPhotoSuggestionStore
{
    void Add(PhotoSuggestion suggestion, TimeSpan lifetime);

    /// <summary>The live suggestion for a preview, whoever asked; the signed URL is the credential.</summary>
    PhotoSuggestion? Get(string id);

    /// <summary>The live suggestion when it belongs to <paramref name="userId"/>, else null.</summary>
    PhotoSuggestion? Take(string id, Guid userId);
}

/// <summary>Per-user search allowance (L2-157 AC7).</summary>
public interface IPhotoSuggestionQuota
{
    /// <summary>Records one search and returns false when the caller is over the hourly limit.</summary>
    bool TryTake(Guid userId, int perHour);
}

/// <summary>One parsed entry of Claude's answer, before any fetch.</summary>
public sealed record PhotoSuggestionCandidate(
    string ImageUrl,
    string Title,
    string SourceName,
    string SourceUrl,
    string Attribution,
    string Licence);
