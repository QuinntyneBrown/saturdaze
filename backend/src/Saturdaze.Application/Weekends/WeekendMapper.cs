using Saturdaze.Application.Contracts;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Weekends;

internal static class WeekendMapper
{
    public static WeekendDto ToDto(Weekend weekend, IReadOnlyList<WeatherForecast> forecast)
    {
        return new WeekendDto(
            weekend.Id,
            weekend.WeekendOf,
            weekend.IsFavourite,
            weekend.Notes,
            weekend.RegenerateCount,
            weekend.Blocks
                .OrderBy(b => b.Day).ThenBy(b => b.SortOrder).ThenBy(b => b.StartTime)
                .Select(b => new ItineraryBlockDto(
                    b.Id, b.Day, b.StartTime, b.EndTime, b.Kind, b.Title, b.RefId, b.IsLocked, b.Reason, b.SortOrder))
                .ToList(),
            weekend.Errands
                .OrderBy(e => e.Description)
                .Select(e => new ShoppingErrandDto(e.Id, e.Description, e.EstimatedMinutes, e.Done))
                .ToList(),
            forecast);
    }
}
