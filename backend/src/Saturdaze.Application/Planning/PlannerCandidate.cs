using Saturdaze.Application.Catalog;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Planning;

public enum CandidateKind
{
    Activity,
    Event
}

/// <summary>
/// A catalog activity or a published local event as the planner weighs it for one day
/// (L2-200, L2-201): the facts that decide whether and when it fits, with the drive
/// time already computed for the family.
/// </summary>
public sealed record PlannerCandidate(
    CandidateKind Kind,
    Guid Id,
    string Name,
    string Category,
    string Description,
    IReadOnlyList<string> Tags,
    bool? Indoor,
    int MinAge,
    int MaxAge,
    int DriveMinutes,
    int DurationMinutes,
    TimeOnly? OpensAt,
    TimeOnly? ClosesAt,
    int? SeasonStartMonth,
    int? SeasonEndMonth,
    TimeOnly? StartTime,
    TimeOnly? EndTime,
    IReadOnlyList<string> Themes,
    GeoLocation? Geo)
{
    /// <summary>A visit to an event with no end is planned as two hours.</summary>
    public const int EventMinutes = 120;

    /// <summary>The least of a timed event worth going for.</summary>
    public const int EventMinMinutes = 60;

    /// <summary>Untimed events are planned between these hours.</summary>
    public static readonly TimeOnly UntimedEventFrom = new(10, 0);
    public static readonly TimeOnly UntimedEventUntil = new(17, 0);

    public bool IsTimedEvent => Kind == CandidateKind.Event && StartTime is not null && EndTime is not null;

    /// <summary>Unknown counts as outdoor for daylight (L2-200).</summary>
    public bool IsOutdoor => Indoor != true;

    public bool InSeason(DateOnly date)
    {
        if (SeasonStartMonth is not { } from || SeasonEndMonth is not { } to) return true;
        var m = date.Month;
        return from <= to ? m >= from && m <= to : m >= from || m <= to;
    }

    public static PlannerCandidate From(Activity a) => new(
        CandidateKind.Activity, a.Id, a.Name, a.Category, a.Description, a.WeatherTags, a.Indoor,
        a.MinAge, a.MaxAge, a.DriveMinutes, a.TypicalDurationMinutes, a.OpensAt, a.ClosesAt,
        a.SeasonStartMonth, a.SeasonEndMonth, null, null, ThemeTagger.Of(a), a.Geo);

    public static PlannerCandidate From(LocalEvent e) => new(
        CandidateKind.Event, e.Id, e.Name, e.Category, string.Empty, Array.Empty<string>(), e.Indoor,
        e.MinAge ?? 0, e.MaxAge ?? 120, e.DriveMinutes, EventMinutes, null, null, null, null,
        e.StartTime, e.EndTime, ThemeTagger.Of(e), e.Geo);
}
