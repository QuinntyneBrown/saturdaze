using Saturdaze.Application.Common;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Planning;

public interface IWeekendPlanner
{
    IReadOnlyList<ItineraryBlock> Plan(PlannerInputs inputs);

    /// <summary>
    /// Returns the highest-scoring activity for a single gap, treating <paramref name="rejected"/>
    /// as ineligible. Used by the swap flow to pick the "next best" alternative for a slot.
    /// </summary>
    Activity? PickActivityForGap(
        PlannerInputs inputs,
        DayOfWeekend day,
        TimeOnly gapStart,
        TimeOnly gapEnd,
        IReadOnlySet<Guid> rejected,
        IRandomSource? rng = null);

    /// <summary>
    /// Constructs the drive→activity→drive blocks for a freshly picked activity occupying a gap.
    /// </summary>
    IReadOnlyList<ItineraryBlock> BuildActivityBlocks(
        Activity activity,
        DayOfWeekend day,
        TimeOnly gapStart,
        TimeOnly gapEnd,
        WeatherForecast forecast,
        bool tryNew);
}
