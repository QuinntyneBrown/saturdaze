namespace Saturdaze.Application.Planning;

/// <summary>Hard schedule bounds for a Saturdaze day. Centralized for tests.</summary>
public static class PlannerTimes
{
    public static readonly TimeOnly DayStart = new(9, 0);
    public static readonly TimeOnly DayEnd = new(21, 0);
    public static readonly TimeOnly SundayWindDownStart = new(19, 30);

    public static readonly TimeOnly LunchWindowStart = new(12, 0);
    public static readonly TimeOnly LunchWindowEnd = new(13, 30);
    public static readonly TimeOnly DinnerWindowStart = new(17, 30);
    public static readonly TimeOnly DinnerWindowEnd = new(19, 0);

    public const int MealMinutes = 60;
    public const int ActivityMinGapMinutes = 90;
    public const int DowntimeMinMinutes = 30;
    public const int ErrandBufferMinutes = 20;
}
