using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Contracts;

/// <summary>
/// The placement the planner proposes for an idea (L2-107): the day and the idea's own
/// start and end, the blocks it would replace, or why it does not fit.
/// </summary>
public sealed record IdeaPlacementDto(
    DayOfWeekend Day,
    TimeOnly StartTime,
    TimeOnly EndTime,
    IReadOnlyList<string> ReplacedBlockTitles,
    bool Fits,
    string? Reason);
