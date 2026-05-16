namespace Saturdaze.Application.Contracts;

public sealed record WeekendSummaryDto(
    Guid Id,
    DateOnly WeekendOf,
    bool IsFavourite,
    int RegenerateCount,
    int BlockCount,
    IReadOnlyList<string> ActivityHighlights,
    string? Title,
    int? Rating);
