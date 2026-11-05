using System.Text.Json;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Planning;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Dates;

/// <summary>Who may go on a date (L2-219 AC3, L2-221): two distinct adults of the caller's family.</summary>
public static class DateAttendees
{
    public const int AdultAge = 18;
    public const string NeedsTwoAdults = "A date needs two adults (18 or over) in your family. Add another adult on Family.";

    public static IReadOnlyList<FamilyMember> Adults(IEnumerable<FamilyMember> members) =>
        members.Where(m => m.Age >= AdultAge).OrderByDescending(m => m.Age).ThenBy(m => m.Name, StringComparer.Ordinal).ToList();

    public static IReadOnlyList<FamilyMember> Resolve(IReadOnlyList<FamilyMember> members, IReadOnlyList<Guid>? requested)
    {
        if (requested is null || requested.Count == 0)
        {
            var adults = Adults(members);
            if (adults.Count < 2) throw new ValidationException("attendeeMemberIds", NeedsTwoAdults);
            return adults.Take(2).ToList();
        }

        if (requested.Count != 2 || requested[0] == requested[1])
            throw new ValidationException("attendeeMemberIds", "Choose exactly two different people for the date.");
        var chosen = requested.Select(id => members.FirstOrDefault(m => m.Id == id)
            ?? throw new NotFoundException(nameof(FamilyMember), id)).ToList();
        if (chosen.Any(m => m.Age < AdultAge))
            throw new ValidationException("attendeeMemberIds", "Both people on a date must be 18 or over.");
        return chosen.OrderByDescending(m => m.Age).ThenBy(m => m.Name, StringComparer.Ordinal).ToList();
    }
}

/// <summary>A date is for this weekend or the next (L2-221 AC7).</summary>
public static class DateWindow
{
    public static void Check(Weekend weekend, DateOnly today)
    {
        var current = GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(today);
        if (weekend.WeekendOf < current || weekend.WeekendOf > current.AddDays(7))
            throw new ValidationException("weekendId", "Dates can be planned for this weekend or next.");
    }
}

/// <summary>What a date may not overlap on its day (L2-222).</summary>
public static class DateBusyTime
{
    public static IReadOnlyList<BusyTime> For(
        PlannerContext ctx, Weekend weekend, DayOfWeekend day, IReadOnlyCollection<Guid> attendees, Guid? exceptDateId)
    {
        var dow = day == DayOfWeekend.Saturday ? DayOfWeek.Saturday : DayOfWeek.Sunday;
        var busy = new List<BusyTime>();
        busy.AddRange(ctx.Family.Commitments
            .Where(c => c.DayOfWeek == dow && (c.AttendeeMemberIds.Count == 0 || c.AttendeeMemberIds.Any(attendees.Contains)))
            .Select(c => new BusyTime(c.StartTime, c.EndTime, c.Title)));
        busy.AddRange((ctx.CalendarCommitments ?? Array.Empty<CalendarCommitment>())
            .Where(c => c.Day == day)
            .Select(c => new BusyTime(c.Start, c.End, c.Title)));
        // Locked blocks (commitments are already above) and the day's other dates.
        busy.AddRange(weekend.Blocks
            .Where(b => b.Day == day && b.IsLocked && b.Kind != BlockKind.Commitment
                        && !(b.Kind == BlockKind.Date && b.RefId == exceptDateId))
            .Select(b => new BusyTime(b.StartTime, b.EndTime, b.Title)));
        return busy;
    }
}

internal static class DateSteps
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static string Serialize(IReadOnlyList<DateStep> steps) => JsonSerializer.Serialize(steps, Json);

    public static IReadOnlyList<DateStep> Deserialize(string json) =>
        JsonSerializer.Deserialize<List<DateStep>>(json, Json) ?? new List<DateStep>();
}

internal static class CoupleDateMapper
{
    public static string Title(CoupleDate date, string restaurant) => $"{date.Meal} date at {restaurant}";

    /// <summary>Members under 18 who are not on the date, oldest first (L2-222 AC4).</summary>
    public static IReadOnlyList<string> KidsNeedCare(CoupleDate date, IEnumerable<FamilyMember> members) =>
        members.Where(m => m.Age < DateAttendees.AdultAge && !date.AttendeeMemberIds.Contains(m.Id))
            .OrderByDescending(m => m.Age).ThenBy(m => m.Name, StringComparer.Ordinal)
            .Select(m => m.Name).ToList();

    public static CoupleDateDto ToDto(
        CoupleDate date, IReadOnlyList<FamilyMember> members, IReadOnlyDictionary<Guid, Restaurant> restaurants,
        IReadOnlyDictionary<Guid, Activity> activities)
    {
        var steps = DateSteps.Deserialize(date.StepsJson);
        var meal = steps.FirstOrDefault(s => s.Kind == "Meal");
        var restaurant = restaurants.GetValueOrDefault(date.RestaurantId);
        var restaurantName = restaurant?.Name ?? meal?.Title.Split(" at ", 2).Last() ?? "the restaurant";
        var activityStep = steps.FirstOrDefault(s => s.Kind == "Activity");
        var activity = date.ActivityId is { } aid
            ? new DateActivityDto(aid, activities.GetValueOrDefault(aid)?.Name ?? activityStep?.Title ?? string.Empty,
                activityStep?.Stop)
            : null;
        return new CoupleDateDto(
            date.Id, date.WeekendId, date.Day, date.Meal, date.StartTime, date.EndTime,
            date.AttendeeMemberIds
                .Select(id => members.FirstOrDefault(m => m.Id == id))
                .Where(m => m is not null)
                .Select(m => new DateAttendeeDto(m!.Id, m.Name))
                .ToList(),
            new DateRestaurantDto(date.RestaurantId, restaurantName, restaurant?.Style ?? string.Empty, meal?.Stop),
            activity,
            steps,
            KidsNeedCare(date, members),
            Title(date, restaurantName));
    }

    public static string Names(CoupleDate date, IEnumerable<FamilyMember> members)
    {
        var names = date.AttendeeMemberIds.Select(id => members.FirstOrDefault(m => m.Id == id)?.Name)
            .Where(n => n is not null).ToList();
        return string.Join(" and ", names);
    }
}
