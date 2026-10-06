using Saturdaze.Application.Contracts;
using Saturdaze.Application.Travel;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Weekends;

internal static class WeekendMapper
{
    public static WeekendDto ToDto(Weekend weekend, IReadOnlyList<WeatherForecast> forecast)
    {
        var (travel, days) = ItineraryTravel.Build(weekend.Blocks, weekend.Home);

        return new WeekendDto(
            weekend.Id,
            weekend.WeekendOf,
            weekend.IsFavourite,
            weekend.Notes,
            weekend.RegenerateCount,
            weekend.Title,
            weekend.Rating,
            weekend.Blocks
                .OrderBy(b => b.Day).ThenBy(b => b.SortOrder).ThenBy(b => b.StartTime)
                .Select(b =>
                {
                    var t = travel.GetValueOrDefault(b.Id);
                    return new ItineraryBlockDto(
                        b.Id, b.Day, b.StartTime, b.EndTime, b.Kind, b.Title, b.RefId, b.IsLocked, b.Reason, b.SortOrder,
                        t?.StopNumber,
                        LocationDto.From(b.Stop),
                        t?.LegBefore is { } leg ? new TravelLegDto(leg.Minutes, leg.DistanceKm, leg.DirectionsUrl) : null);
                })
                .ToList(),
            weekend.Errands
                .OrderBy(e => e.Description)
                .Select(e => new ShoppingErrandDto(e.Id, e.Description, e.EstimatedMinutes, e.Done))
                .ToList(),
            forecast,
            days.Select(d => new DayDto(d.Day, d.StopCount, d.DrivingMinutes, d.DrivingKm)).ToList(),
            LocationDto.From(weekend.Home));
    }
}
