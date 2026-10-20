namespace Saturdaze.Application.PhotoSuggestions;

/// <summary>One suggestion as the dialogs show it (L2-157): the signed preview and the credit, never the source image address.</summary>
public sealed record PhotoSuggestionDto(
    string Id,
    string PreviewUrl,
    int Width,
    int Height,
    string Title,
    string SourceName,
    string SourceUrl,
    string Attribution,
    string Licence);

public sealed record PhotoSuggestionsDto(IReadOnlyList<PhotoSuggestionDto> Suggestions);
