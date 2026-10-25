namespace Saturdaze.Application.Planning;

/// <summary>Hard schedule bounds for a Saturdaze day. Centralized for tests.</summary>
public static class PlannerTimes
{
    public static readonly TimeOnly DayStart = new(9, 0);
    public static readonly TimeOnly DayEnd = new(21, 0);
    public static readonly TimeOnly SundayWindDownStart = new(19, 30);

    // Meal windows (L2-186): a meal starts between its earliest and latest start,
    // searched from the preferred start; it never moves outside the window.
    public static readonly TimeOnly LunchEarliestStart = new(11, 30);
    public static readonly TimeOnly LunchWindowStart = new(12, 0);
    public static readonly TimeOnly LunchLatestStart = new(13, 30);
    public static readonly TimeOnly LunchWindowEnd = new(14, 30);
    public static readonly TimeOnly DinnerEarliestStart = new(17, 0);
    public static readonly TimeOnly DinnerWindowStart = new(17, 30);
    public static readonly TimeOnly DinnerLatestStart = new(19, 0);
    public static readonly TimeOnly DinnerWindowEnd = new(20, 0);

    public const int MealMinutes = 60;
    public const int ActivityMinGapMinutes = 90;

    /// <summary>
    /// The least time an activity itself must get once both drives are
    /// subtracted from the gap; anything shorter is not worth the trip.
    /// </summary>
    public const int ActivityMinMinutes = 30;

    public const int DowntimeMinMinutes = 30;
    public const int ErrandBufferMinutes = 20;
}
