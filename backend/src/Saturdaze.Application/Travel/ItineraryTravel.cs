using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Travel;

/// <summary>One block's place in the day's journey: its stop number and the leg into it.</summary>
public sealed record BlockTravel(int? StopNumber, TravelLeg? LegBefore);

public sealed record TravelLeg(int Minutes, decimal DistanceKm, string? DirectionsUrl);

/// <summary>A day's totals: stops away from home and the sum of its legs.</summary>
public sealed record DayTravel(DayOfWeekend Day, int StopCount, int DrivingMinutes, decimal DrivingKm);

/// <summary>
/// Walks each day in order and derives the journey (L2-090, L2-091). A block with a
/// <see cref="ItineraryBlock.Stop"/> is a numbered stop; downtime and home meals are at home;
/// anything else (commitments, errands, unplaced blocks) has no known place and leaves the
/// journey where it was. A leg is emitted where the place changes; its minutes are the drive
/// the planner scheduled in between, else an estimate from the distance.
/// </summary>
public static class ItineraryTravel
{
    public static (IReadOnlyDictionary<Guid, BlockTravel> Blocks, IReadOnlyList<DayTravel> Days) Build(
        IEnumerable<ItineraryBlock> blocks, GeoLocation? home)
    {
        var perBlock = new Dictionary<Guid, BlockTravel>();
        var days = new List<DayTravel>();

        foreach (var day in blocks.GroupBy(b => b.Day).OrderBy(g => g.Key))
        {
            var here = home;
            var scheduledDrive = 0;
            var stops = 0;
            var drivingMinutes = 0;
            var drivingKm = 0m;

            foreach (var block in day.OrderBy(b => b.SortOrder).ThenBy(b => b.StartTime))
            {
                if (block.Kind == BlockKind.Drive)
                {
                    scheduledDrive += (int)(block.EndTime - block.StartTime).TotalMinutes;
                    perBlock[block.Id] = new BlockTravel(null, null);
                    continue;
                }

                var place = block.Stop ?? (IsAtHome(block) ? home : null);
                TravelLeg? leg = null;
                if (place is not null)
                {
                    if (here is not null && !SamePoint(here, place))
                    {
                        var km = TravelEstimator.DistanceKm(here, place);
                        var minutes = scheduledDrive > 0 ? scheduledDrive : TravelEstimator.Minutes(km);
                        leg = new TravelLeg(minutes, km, DirectionsLinkBuilder.Build(here, place, minutes));
                        drivingMinutes += minutes;
                        drivingKm += km;
                    }

                    here = place;
                    scheduledDrive = 0;
                }

                var stopNumber = block.Stop is null ? (int?)null : ++stops;
                perBlock[block.Id] = new BlockTravel(stopNumber, leg);
            }

            days.Add(new DayTravel(day.Key, stops, drivingMinutes, drivingKm));
        }

        return (perBlock, days);
    }

    private static bool IsAtHome(ItineraryBlock block) =>
        block.Kind == BlockKind.Downtime || block.Kind == BlockKind.Meal && block.RefId is null;

    private static bool SamePoint(GeoLocation a, GeoLocation b) =>
        a.Latitude == b.Latitude && a.Longitude == b.Longitude;
}
