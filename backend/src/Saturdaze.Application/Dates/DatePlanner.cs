using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Planning;
using Saturdaze.Application.Travel;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Dates;

/// <summary>Time on the date's day that the date may not overlap (L2-222).</summary>
public sealed record BusyTime(TimeOnly Start, TimeOnly End, string Title);

/// <summary>A drive, the meal or the activity of a date, with why it was picked (L2-219, L2-224).</summary>
public sealed record DateStep(
    string Kind, string Title, TimeOnly StartTime, TimeOnly EndTime, string Reason, Guid? RefId, LocationDto? Stop);

/// <summary>What <see cref="DatePlanner"/> needs: the family's planner context and the date's own constraints.</summary>
public sealed record DateRequest(
    PlannerContext Context,
    IReadOnlyList<FamilyMember> Attendees,
    DayOfWeekend Day,
    MealSlot Meal,
    IReadOnlyList<BusyTime> Busy,
    IReadOnlyDictionary<Guid, int> Votes,
    Guid? LockedRestaurantId,
    IReadOnlySet<Guid> RejectedRestaurants,
    IReadOnlySet<Guid> RejectedActivities,
    bool WithActivity,
    Guid? AvoidRestaurantId = null);

public sealed record DatePlan(
    Restaurant Restaurant, Activity? Activity, TimeOnly Start, TimeOnly End, IReadOnlyList<DateStep> Steps);

/// <summary>
/// Deterministic date planner (L2-219, L2-222 → L2-224, ADR-025): ranks the meal's restaurants by the
/// family's lock, likes, votes and drive; takes the first that fits a meal start in its window around
/// the attendees' busy time; adds the nearest activity that fits before (dinner) or after (breakfast,
/// lunch) the meal. Same inputs, same date.
/// </summary>
public sealed class DatePlanner
{
    public const int MealMinutes = 90;
    public const int ActivityMinutes = 60;
    public const int NearbyMinutes = 15;
    private const int StepMinutes = 15;

    /// <summary>The meal itself starts and ends inside its window (L2-219).</summary>
    public static (TimeOnly Start, TimeOnly End) Window(MealSlot meal) => meal switch
    {
        MealSlot.Breakfast => (new TimeOnly(8, 0), new TimeOnly(10, 30)),
        MealSlot.Lunch => (new TimeOnly(11, 30), new TimeOnly(14, 0)),
        _ => (new TimeOnly(17, 30), new TimeOnly(21, 0)),
    };

    public DatePlan Plan(DateRequest request)
    {
        var ranked = RankRestaurants(request);
        var meal = request.Meal.ToString().ToLowerInvariant();
        if (ranked.Count == 0)
            throw new ConflictException("no_restaurant_fits",
                $"No {meal} spot fits: none of the family's approved {meal} places is within your " +
                $"{request.Context.Profile?.MaxDriveMinutes ?? PlannerProfile.Default.MaxDriveMinutes}-minute drive " +
                "and free of your dislikes. Try another meal or day, or a longer drive on Family.");

        var window = Window(request.Meal);
        BusyTime? firstClash = null;
        foreach (var (restaurant, reason) in ranked)
        {
            var drive = Math.Max(1, restaurant.DriveMinutes);
            for (var start = Min(window.Start); start + MealMinutes <= Min(window.End); start += StepMinutes)
            {
                if (start - drive < 0 || start + MealMinutes + drive >= 24 * 60) continue;
                var clash = Clash(request.Busy, start - drive, start + MealMinutes + drive);
                if (clash is not null)
                {
                    firstClash ??= clash;
                    continue;
                }
                return Build(request, restaurant, reason, start);
            }
        }

        throw new ConflictException("date_clash",
            $"Nothing fits {request.Day} {meal} for the two of you: it clashes with {firstClash?.Title ?? "the weekend"}. " +
            "Try another meal or day.");
    }

    // ─── Restaurants ──────────────────────────────────────────────────────────

    private static List<(Restaurant Restaurant, string Reason)> RankRestaurants(DateRequest request)
    {
        var ctx = request.Context;
        var profile = ctx.Profile ?? PlannerProfile.Default;
        var prefs = ctx.Family.Preferences;
        var likes = prefs.Where(p => p.Kind == PreferenceKind.Like).Select(p => p.Value).ToList();
        var dislikes = prefs.Where(p => p.Kind == PreferenceKind.Dislike).Select(p => p.Value).ToList();

        return ctx.Restaurants
            .Where(r => r.Slot == request.Meal && r.WifeApproved && r.DriveMinutes <= profile.MaxDriveMinutes)
            .Where(r => !request.RejectedRestaurants.Contains(r.Id))
            .Where(r => !dislikes.Any(d => Matches(r, d)) && !profile.ExcludedThemes.Any(t => Matches(r, t)))
            .Select(r => new
            {
                Restaurant = r,
                Locked = r.Id == request.LockedRestaurantId,
                Liked = likes.Where(l => Matches(r, l)).ToList(),
                Votes = request.Votes.GetValueOrDefault(r.Id),
            })
            .OrderBy(x => x.Restaurant.Id == request.AvoidRestaurantId ? 1 : 0)
            .ThenByDescending(x => x.Locked)
            .ThenByDescending(x => 3 * x.Liked.Count + x.Votes)
            .ThenBy(x => x.Restaurant.DriveMinutes)
            .ThenBy(x => x.Restaurant.Name, StringComparer.Ordinal)
            .Select(x => (x.Restaurant, RestaurantReason(x.Restaurant, x.Locked, x.Liked, x.Votes)))
            .ToList();
    }

    private static string RestaurantReason(Restaurant r, bool locked, IReadOnlyList<string> liked, int votes)
    {
        var parts = new List<string>();
        if (locked) parts.Add("locked by family vote");
        parts.AddRange(liked.Select(l => $"you like {l}"));
        if (votes > 0) parts.Add(votes == 1 ? "1 vote up" : $"{votes} votes up");
        parts.Add(r.DriveMinutes <= NearbyMinutes ? "near home" : $"{r.DriveMinutes} min from home");
        if (!string.IsNullOrWhiteSpace(r.Style)) parts.Insert(0, r.Style);
        return string.Join(" · ", parts);
    }

    private static bool Matches(Restaurant r, string tag) =>
        !string.IsNullOrWhiteSpace(tag)
        && (r.Name.Contains(tag.Trim(), StringComparison.OrdinalIgnoreCase)
            || r.Style.Contains(tag.Trim(), StringComparison.OrdinalIgnoreCase));

    // ─── The date ─────────────────────────────────────────────────────────────

    private static DatePlan Build(DateRequest request, Restaurant restaurant, string reason, int mealStart)
    {
        var mealEnd = mealStart + MealMinutes;
        var drive = Math.Max(1, restaurant.DriveMinutes);
        var mealStep = new DateStep("Meal", $"{request.Meal} at {restaurant.Name}", T(mealStart), T(mealEnd), reason,
            restaurant.Id, LocationDto.From(restaurant.Geo));

        var outing = request.WithActivity ? PickActivity(request, restaurant, mealStart, mealEnd) : null;
        var steps = new List<DateStep>();
        if (outing is { } o)
        {
            var activityStep = new DateStep("Activity", o.Activity.Name, T(o.Start), T(o.End), o.Reason, o.Activity.Id,
                LocationDto.From(o.Activity.Geo));
            var activityDrive = Math.Max(1, o.Activity.DriveMinutes);
            if (o.Start < mealStart)
            {
                steps.Add(DriveTo(o.Activity.Name, o.Start - activityDrive, o.Start));
                steps.Add(activityStep);
                steps.Add(mealStep);
                steps.Add(DriveHome(restaurant.Name, mealEnd, mealEnd + drive));
            }
            else
            {
                steps.Add(DriveTo(restaurant.Name, mealStart - drive, mealStart));
                steps.Add(mealStep);
                steps.Add(activityStep);
                steps.Add(DriveHome(o.Activity.Name, o.End, o.End + activityDrive));
            }
        }
        else
        {
            steps.Add(DriveTo(restaurant.Name, mealStart - drive, mealStart));
            steps.Add(mealStep);
            steps.Add(DriveHome(restaurant.Name, mealEnd, mealEnd + drive));
        }

        return new DatePlan(restaurant, outing?.Activity, steps[0].StartTime, steps[^1].EndTime, steps);
    }

    private sealed record Outing(Activity Activity, int Start, int End, string Reason);

    /// <summary>
    /// The nearest catalog activity within <see cref="NearbyMinutes"/> of the restaurant that the attendees
    /// may do that day, open for the visit, outdoors over by sunset, and leaving the date clear of busy time.
    /// </summary>
    private static Outing? PickActivity(DateRequest request, Restaurant restaurant, int mealStart, int mealEnd)
    {
        if (restaurant.Geo is null) return null;
        var ctx = request.Context;
        var inputs = ctx.ToInputs(Array.Empty<ItineraryBlock>(), null, 0) with { Members = request.Attendees };
        var sunset = ctx.Sunsets?.GetValueOrDefault(request.Day);
        var before = request.Meal == MealSlot.Dinner;
        var drive = Math.Max(1, restaurant.DriveMinutes);

        var nearby = ctx.Activities
            .Where(a => a.Geo is not null && !request.RejectedActivities.Contains(a.Id))
            .Where(a => CandidateFilter.Exclusion(inputs, PlannerCandidate.From(a), request.Day) is null)
            .Select(a => (Activity: a, Km: TravelEstimator.DistanceKm(restaurant.Geo, a.Geo!)))
            .Select(x => (x.Activity, x.Km, Transfer: TravelEstimator.Minutes(x.Km)))
            .Where(x => x.Transfer <= NearbyMinutes)
            .OrderBy(x => x.Km)
            .ThenBy(x => x.Activity.Name, StringComparer.Ordinal);

        foreach (var (a, _, transfer) in nearby)
        {
            var activityDrive = Math.Max(1, a.DriveMinutes);
            var start = before ? mealStart - transfer - ActivityMinutes : mealEnd + transfer;
            var end = start + ActivityMinutes;
            var (spanStart, spanEnd) = before ? (start - activityDrive, mealEnd + drive) : (mealStart - drive, end + activityDrive);
            if (spanStart < 0 || spanEnd >= 24 * 60) continue;
            if (a.OpensAt is { } opens && start < Min(opens)) continue;
            if (a.ClosesAt is { } closes && end > Min(closes)) continue;
            var outdoor = a.Indoor != true;
            if (outdoor && sunset is { } dusk && end > Min(dusk)) continue;
            if (Clash(request.Busy, spanStart, spanEnd) is not null) continue;

            var parts = new List<string> { $"{transfer} min from {restaurant.Name}" };
            if (a.OpensAt is { } o && a.ClosesAt is { } c) parts.Add($"open {o:H\\:mm}–{c:H\\:mm}");
            if (outdoor && sunset is { } s) parts.Add($"back before sunset {s:H\\:mm}");
            return new Outing(a, start, end, string.Join(" · ", parts));
        }
        return null;
    }

    private static DateStep DriveTo(string place, int start, int end) =>
        new("Drive", $"Drive to {place}", T(start), T(end), $"{end - start} min from home", null, null);

    private static DateStep DriveHome(string place, int start, int end) =>
        new("Drive", $"Drive home from {place}", T(start), T(end), $"{end - start} min home", null, null);

    private static BusyTime? Clash(IEnumerable<BusyTime> busy, int start, int end) =>
        busy.OrderBy(b => b.Start).FirstOrDefault(b => Min(b.Start) < end && start < Min(b.End));

    private static int Min(TimeOnly t) => t.Hour * 60 + t.Minute;

    private static TimeOnly T(int minutes) => new(minutes / 60, minutes % 60);
}
