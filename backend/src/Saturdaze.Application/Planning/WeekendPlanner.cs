using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Planning;

/// <summary>
/// Rule-based, deterministic planner. Same inputs + seed → identical output.
/// Algorithm follows section 5 of backend-plan.md verbatim.
/// </summary>
public sealed class WeekendPlanner : IWeekendPlanner
{
    public IReadOnlyList<ItineraryBlock> Plan(PlannerInputs inputs)
    {
        var rng = new SeededRandomSource(inputs.Seed);
        var blocks = new List<ItineraryBlock>();
        foreach (var day in new[] { DayOfWeekend.Saturday, DayOfWeekend.Sunday })
        {
            var dayDate = day == DayOfWeekend.Saturday ? inputs.WeekendOf : inputs.WeekendOf.AddDays(1);
            var forecast = ForecastFor(inputs.Forecast, dayDate);
            blocks.AddRange(PlanDay(inputs, day, dayDate, forecast, rng));
        }
        return blocks;
    }

    public Activity? PickActivityForGap(
        PlannerInputs inputs,
        DayOfWeekend day,
        TimeOnly gapStart,
        TimeOnly gapEnd,
        IReadOnlySet<Guid> rejected,
        IRandomSource? rng = null)
    {
        var dayDate = day == DayOfWeekend.Saturday ? inputs.WeekendOf : inputs.WeekendOf.AddDays(1);
        var forecast = ForecastFor(inputs.Forecast, dayDate);
        var scored = ScoreActivities(inputs, (gapStart, gapEnd), forecast, rejected.ToHashSet(), day);
        if (scored.Count == 0) return null;
        var topScore = scored[0].score;
        var topCandidates = scored.TakeWhile(s => s.score == topScore).Select(s => s.activity).ToList();
        rng ??= new SeededRandomSource(inputs.Seed);
        return topCandidates[rng.Next(topCandidates.Count)];
    }

    public IReadOnlyList<ItineraryBlock> BuildActivityBlocks(
        Activity activity,
        DayOfWeekend day,
        TimeOnly gapStart,
        TimeOnly gapEnd,
        WeatherForecast forecast,
        bool tryNew)
        => BuildActivityWithDrives(activity, (gapStart, gapEnd), forecast, tryNew, day).ToList();

    // ─── Day pipeline ────────────────────────────────────────────────────────

    private static IEnumerable<ItineraryBlock> PlanDay(
        PlannerInputs inputs, DayOfWeekend day, DateOnly date, WeatherForecast forecast, IRandomSource rng)
    {
        var fixedBlocks = BuildFixedBlocks(inputs, day);
        EnsureNoOverlap(fixedBlocks);

        var gaps = ComputeGaps(day, fixedBlocks);
        var picked = new Dictionary<TimeOnly, Activity>(); // gap-start → activity
        var rejected = new HashSet<Guid>();

        foreach (var gap in gaps.Where(g => GapMinutes(g) >= PlannerTimes.ActivityMinGapMinutes).ToList())
        {
            var scored = ScoreActivities(inputs, gap, forecast, rejected, day);
            if (scored.Count == 0) continue;

            var topScore = scored[0].score;
            var topCandidates = scored.TakeWhile(s => s.score == topScore).Select(s => s.activity).ToList();
            var winner = topCandidates[rng.Next(topCandidates.Count)];
            picked[gap.start] = winner;
            rejected.Add(winner.Id);
        }

        var result = new List<ItineraryBlock>(fixedBlocks);
        foreach (var (gapStart, activity) in picked)
        {
            var gap = gaps.First(g => g.start == gapStart);
            result.AddRange(BuildActivityWithDrives(activity, gap, forecast, inputs.TryNew, day));
        }

        result.AddRange(PlaceMeals(inputs, day, date, result, picked));
        result = result.OrderBy(b => b.StartTime).ToList();

        if (day == DayOfWeekend.Saturday && inputs.Errand is not null)
        {
            var errandBlock = PlaceErrand(inputs.Errand, result, day);
            if (errandBlock is not null) result.Add(errandBlock);
        }

        result = result.OrderBy(b => b.StartTime).ToList();
        result.AddRange(FillDowntime(day, result));
        result = result.OrderBy(b => b.StartTime).ToList();

        // Apply sort order index.
        var sorted = new List<ItineraryBlock>();
        var i = 0;
        foreach (var b in result.OrderBy(b => b.StartTime))
        {
            b.Day = day;
            b.SortOrder = i++;
            sorted.Add(b);
        }
        return sorted;
    }

    // ─── Fixed blocks (commitments + locked) ──────────────────────────────────

    private static List<ItineraryBlock> BuildFixedBlocks(PlannerInputs inputs, DayOfWeekend day)
    {
        var dow = day == DayOfWeekend.Saturday ? DayOfWeek.Saturday : DayOfWeek.Sunday;
        var locked = inputs.LockedBlocks.Where(b => b.Day == day).ToList();
        var commitments = inputs.Commitments.Where(c => c.DayOfWeek == dow);

        var list = new List<ItineraryBlock>();
        foreach (var c in commitments)
        {
            list.Add(new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                Day = day,
                StartTime = c.StartTime,
                EndTime = c.EndTime,
                Kind = BlockKind.Commitment,
                Title = c.Title,
                Reason = "fixed commitment"
            });
        }
        foreach (var l in locked)
        {
            list.Add(new ItineraryBlock
            {
                Id = l.Id,
                Day = day,
                StartTime = l.StartTime,
                EndTime = l.EndTime,
                Kind = l.Kind,
                Title = l.Title,
                RefId = l.RefId,
                IsLocked = true,
                Reason = string.IsNullOrEmpty(l.Reason) ? "locked by user" : l.Reason
            });
        }
        return list.OrderBy(b => b.StartTime).ToList();
    }

    private static void EnsureNoOverlap(IReadOnlyList<ItineraryBlock> blocks)
    {
        for (var i = 1; i < blocks.Count; i++)
        {
            if (blocks[i].StartTime < blocks[i - 1].EndTime)
                throw new ConflictException(
                    $"Commitments overlap on {blocks[i].Day}: '{blocks[i - 1].Title}' and '{blocks[i].Title}'.");
        }
    }

    // ─── Gap computation ──────────────────────────────────────────────────────

    private static List<(TimeOnly start, TimeOnly end)> ComputeGaps(DayOfWeekend day, IReadOnlyList<ItineraryBlock> fixedBlocks)
    {
        var end = day == DayOfWeekend.Sunday ? PlannerTimes.SundayWindDownStart : PlannerTimes.DayEnd;
        var gaps = new List<(TimeOnly start, TimeOnly end)>();
        var cursor = PlannerTimes.DayStart;
        foreach (var b in fixedBlocks.OrderBy(b => b.StartTime))
        {
            if (cursor < b.StartTime) gaps.Add((cursor, b.StartTime));
            if (b.EndTime > cursor) cursor = b.EndTime;
        }
        if (cursor < end) gaps.Add((cursor, end));
        return gaps;
    }

    private static int GapMinutes((TimeOnly start, TimeOnly end) g) =>
        (int)(g.end.ToTimeSpan() - g.start.ToTimeSpan()).TotalMinutes;

    // ─── Activity scoring ─────────────────────────────────────────────────────

    private static List<(Activity activity, int score)> ScoreActivities(
        PlannerInputs inputs, (TimeOnly start, TimeOnly end) gap, WeatherForecast forecast,
        ISet<Guid> alreadyPicked, DayOfWeekend day)
    {
        var minutes = GapMinutes(gap);
        var likedTags = inputs.Preferences
            .Where(p => p.Kind == PreferenceKind.Like)
            .Select(p => p.Value)
            .ToList();
        var dislikedTags = inputs.Preferences
            .Where(p => p.Kind == PreferenceKind.Dislike)
            .Select(p => p.Value)
            .ToList();

        var results = new List<(Activity, int)>();
        foreach (var act in inputs.Activities)
        {
            if (alreadyPicked.Contains(act.Id)) continue;
            if (act.TypicalDurationMinutes > minutes) continue;

            // Disqualifying conditions first.
            if (dislikedTags.Any(d => MatchesTag(act, d))) continue;
            var ageOutside = inputs.Members.Count(m => m.Age < act.MinAge || m.Age > act.MaxAge);
            if (ageOutside >= 2) continue;

            int score = 0;

            // Weather fit (only if forecast available).
            if (!forecast.Unavailable)
            {
                if (forecast.Tags.Contains("rain") && act.Indoor) score += 3;
                if ((forecast.Tags.Contains("sunny") || forecast.Tags.Contains("warm")) && !act.Indoor) score += 2;
                if (forecast.Tags.Contains("snow") && act.Indoor) score += 3;
            }

            // Drive fit.
            var roundTrip = act.DriveMinutes * 2;
            if (roundTrip > minutes * 0.4) score -= 2;

            // Age fit.
            if (ageOutside == 0) score += 2;

            // Recency.
            score += RecencyScore(inputs, act.Id);

            // Try-new.
            if (inputs.TryNew && inputs.History.All(h => h.ActivityId != act.Id)) score += 3;

            // Preference matches.
            score += likedTags.Count(t => MatchesTag(act, t));

            results.Add((act, score));
        }

        // Stable sort: highest score first, tie-break by activity name for determinism before rng pick.
        return results.OrderByDescending(r => r.Item2).ThenBy(r => r.Item1.Name).ToList();
    }

    private static int RecencyScore(PlannerInputs inputs, Guid activityId)
    {
        var weekendsBack = inputs.History
            .Where(h => h.ActivityId == activityId)
            .Select(h => (inputs.WeekendOf.DayNumber - h.WeekendOf.DayNumber) / 7)
            .Where(w => w >= 0)
            .DefaultIfEmpty(int.MaxValue)
            .Min();
        return weekendsBack switch
        {
            <= 1 => -4,
            <= 4 => -1,
            _ => 0
        };
    }

    private static bool MatchesTag(Activity act, string tag) =>
        act.WeatherTags.Any(t => string.Equals(t, tag, StringComparison.OrdinalIgnoreCase))
        || string.Equals(act.Category, tag, StringComparison.OrdinalIgnoreCase)
        || act.Name.Contains(tag, StringComparison.OrdinalIgnoreCase)
        || act.Description.Contains(tag, StringComparison.OrdinalIgnoreCase);

    // ─── Activity placement with drive blocks ─────────────────────────────────

    private static IEnumerable<ItineraryBlock> BuildActivityWithDrives(
        Activity act, (TimeOnly start, TimeOnly end) gap, WeatherForecast forecast, bool tryNew, DayOfWeekend day)
    {
        var drive = act.DriveMinutes;
        var activityStart = gap.start.AddMinutes(drive);
        var activityEnd = activityStart.AddMinutes(act.TypicalDurationMinutes);
        if (activityEnd > gap.end.AddMinutes(-drive))
            activityEnd = gap.end.AddMinutes(-drive);

        if (drive > 0)
        {
            yield return new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                Day = day,
                StartTime = gap.start,
                EndTime = activityStart,
                Kind = BlockKind.Drive,
                Title = $"Drive to {act.Name}",
                Reason = $"{drive} min drive"
            };
        }

        yield return new ItineraryBlock
        {
            Id = Guid.NewGuid(),
            Day = day,
            StartTime = activityStart,
            EndTime = activityEnd,
            Kind = BlockKind.Activity,
            Title = act.Name,
            RefId = act.Id,
            Reason = BuildActivityReason(act, forecast, tryNew, GapMinutes(gap))
        };

        if (drive > 0 && activityEnd.AddMinutes(drive) <= gap.end)
        {
            yield return new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                Day = day,
                StartTime = activityEnd,
                EndTime = activityEnd.AddMinutes(drive),
                Kind = BlockKind.Drive,
                Title = $"Drive home from {act.Name}",
                Reason = $"{drive} min drive"
            };
        }
    }

    private static string BuildActivityReason(Activity act, WeatherForecast forecast, bool tryNew, int gapMinutes)
    {
        var parts = new List<string>();
        if (forecast.Unavailable) parts.Add("weather unavailable");
        else
        {
            if (forecast.Tags.Contains("rain") && act.Indoor) parts.Add("indoor pick — rain in forecast");
            else if ((forecast.Tags.Contains("sunny") || forecast.Tags.Contains("warm")) && !act.Indoor)
                parts.Add("outdoor pick — fair weather");
            else if (forecast.Tags.Contains("snow") && act.Indoor) parts.Add("indoor pick — snow in forecast");
        }
        if (tryNew) parts.Add("first time trying this — variety on");
        parts.Add($"fits {act.TypicalDurationMinutes}-min window in {gapMinutes}-min gap");
        return string.Join("; ", parts);
    }

    // ─── Meals ────────────────────────────────────────────────────────────────

    private static List<ItineraryBlock> PlaceMeals(
        PlannerInputs inputs, DayOfWeekend day, DateOnly date,
        List<ItineraryBlock> placedSoFar, Dictionary<TimeOnly, Activity> picked)
    {
        var meals = new List<ItineraryBlock>();
        foreach (var (slot, winStart, winEnd) in new[]
        {
            (MealSlot.Lunch,  PlannerTimes.LunchWindowStart,  PlannerTimes.LunchWindowEnd),
            (MealSlot.Dinner, PlannerTimes.DinnerWindowStart, PlannerTimes.DinnerWindowEnd)
        })
        {
            // Sunday wind-down blocks dinner.
            if (slot == MealSlot.Dinner && day == DayOfWeekend.Sunday) continue;

            var candidates = inputs.Restaurants
                .Where(r => r.Slot == slot && r.WifeApproved)
                .ToList();
            if (candidates.Count == 0) continue;

            var anchorActivity = picked.Values
                .OrderBy(a => Math.Abs(MidpointMinutes(winStart, winEnd) - DriveMidpoint(a)))
                .FirstOrDefault();
            var restaurant = anchorActivity is null
                ? candidates.OrderBy(r => r.DriveMinutes).First()
                : candidates
                    .OrderBy(r => Math.Abs(r.DriveMinutes - anchorActivity.DriveMinutes))
                    .ThenBy(r => r.Name)
                    .First();

            var mealRange = FindMealSlot(placedSoFar, meals, winStart, winEnd, day);
            if (mealRange is null) continue;

            meals.Add(new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                Day = day,
                StartTime = mealRange.Value.start,
                EndTime = mealRange.Value.end,
                Kind = BlockKind.Meal,
                Title = $"{slot}: {restaurant.Name}",
                RefId = restaurant.Id,
                Reason = anchorActivity is null
                    ? $"closest {slot.ToString().ToLowerInvariant()} spot"
                    : $"close to {anchorActivity.Name}"
            });
        }
        return meals;
    }

    private static (TimeOnly start, TimeOnly end)? FindMealSlot(
        IReadOnlyList<ItineraryBlock> existing, IReadOnlyList<ItineraryBlock> meals,
        TimeOnly winStart, TimeOnly winEnd, DayOfWeekend day)
    {
        var sorted = existing.Concat(meals).Where(b => b.Day == day).OrderBy(b => b.StartTime).ToList();
        // Try preferred window first.
        if (FitsIn(sorted, winStart, winEnd, PlannerTimes.MealMinutes, out var fit))
            return fit;

        // Otherwise scan day for a 60-min gap, preferring closest to original window midpoint.
        var dayBoundEnd = day == DayOfWeekend.Sunday ? PlannerTimes.SundayWindDownStart : PlannerTimes.DayEnd;
        var freeRanges = FindFreeRanges(sorted, PlannerTimes.DayStart, dayBoundEnd, PlannerTimes.MealMinutes);
        var winMid = MidpointMinutes(winStart, winEnd);
        var best = freeRanges
            .Select(r => (r.start, end: r.start.AddMinutes(PlannerTimes.MealMinutes),
                          dist: Math.Abs(MidpointMinutes(r.start, r.start.AddMinutes(PlannerTimes.MealMinutes)) - winMid)))
            .OrderBy(r => r.dist)
            .Select(r => ((TimeOnly start, TimeOnly end)?)(r.start, r.end))
            .FirstOrDefault();
        return best;
    }

    private static bool FitsIn(
        IReadOnlyList<ItineraryBlock> sorted, TimeOnly winStart, TimeOnly winEnd, int neededMinutes,
        out (TimeOnly start, TimeOnly end) fit)
    {
        // Slide a 60-min slot inside [winStart, winEnd] checking against existing blocks.
        for (var t = winStart; t.AddMinutes(neededMinutes) <= winEnd; t = t.AddMinutes(15))
        {
            var candidateEnd = t.AddMinutes(neededMinutes);
            if (!sorted.Any(b => Overlaps(b.StartTime, b.EndTime, t, candidateEnd)))
            {
                fit = (t, candidateEnd);
                return true;
            }
        }
        fit = default;
        return false;
    }

    private static List<(TimeOnly start, TimeOnly end)> FindFreeRanges(
        IReadOnlyList<ItineraryBlock> sorted, TimeOnly from, TimeOnly to, int minMinutes)
    {
        var ranges = new List<(TimeOnly, TimeOnly)>();
        var cursor = from;
        foreach (var b in sorted.OrderBy(b => b.StartTime))
        {
            if (cursor < b.StartTime && Minutes(cursor, b.StartTime) >= minMinutes)
                ranges.Add((cursor, b.StartTime));
            if (b.EndTime > cursor) cursor = b.EndTime;
        }
        if (cursor < to && Minutes(cursor, to) >= minMinutes) ranges.Add((cursor, to));
        return ranges;
    }

    private static bool Overlaps(TimeOnly aStart, TimeOnly aEnd, TimeOnly bStart, TimeOnly bEnd) =>
        aStart < bEnd && bStart < aEnd;

    private static int Minutes(TimeOnly a, TimeOnly b) => (int)(b.ToTimeSpan() - a.ToTimeSpan()).TotalMinutes;

    private static int MidpointMinutes(TimeOnly a, TimeOnly b) =>
        (Minutes(TimeOnly.MinValue, a) + Minutes(TimeOnly.MinValue, b)) / 2;

    private static int DriveMidpoint(Activity a) =>
        Minutes(TimeOnly.MinValue, PlannerTimes.DayStart) + 240 + a.DriveMinutes; // crude proxy for "when is the activity"

    // ─── Errand placement ─────────────────────────────────────────────────────

    private static ItineraryBlock? PlaceErrand(ShoppingErrand errand, IReadOnlyList<ItineraryBlock> placed, DayOfWeekend day)
    {
        var neededMinutes = errand.EstimatedMinutes + PlannerTimes.ErrandBufferMinutes;
        var sorted = placed.Where(b => b.Day == day).OrderBy(b => b.StartTime).ToList();

        var dayBoundEnd = day == DayOfWeekend.Sunday ? PlannerTimes.SundayWindDownStart : PlannerTimes.DayEnd;
        var ranges = FindFreeRanges(sorted, PlannerTimes.DayStart, dayBoundEnd, neededMinutes);
        if (ranges.Count == 0) return null;

        // Prefer Saturday morning (before noon), choosing smallest-fit gap to leave room.
        var morningFirst = ranges
            .Select(r => (r.start, r.end, mins: Minutes(r.start, r.end)))
            .OrderBy(r => r.start < new TimeOnly(12, 0) ? 0 : 1)
            .ThenBy(r => r.mins)
            .First();

        return new ItineraryBlock
        {
            Id = Guid.NewGuid(),
            Day = day,
            StartTime = morningFirst.start,
            EndTime = morningFirst.start.AddMinutes(neededMinutes),
            Kind = BlockKind.Errand,
            Title = errand.Description,
            RefId = errand.Id,
            Reason = morningFirst.start < new TimeOnly(12, 0)
                ? "errand placed Saturday morning"
                : "errand placed in next-best slot"
        };
    }

    // ─── Downtime ─────────────────────────────────────────────────────────────

    private static IEnumerable<ItineraryBlock> FillDowntime(DayOfWeekend day, IReadOnlyList<ItineraryBlock> placed)
    {
        var sorted = placed.Where(b => b.Day == day).OrderBy(b => b.StartTime).ToList();
        var dayBoundEnd = day == DayOfWeekend.Sunday ? PlannerTimes.SundayWindDownStart : PlannerTimes.DayEnd;
        foreach (var (start, end) in FindFreeRanges(sorted, PlannerTimes.DayStart, dayBoundEnd, PlannerTimes.DowntimeMinMinutes))
        {
            yield return new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                Day = day,
                StartTime = start,
                EndTime = end,
                Kind = BlockKind.Downtime,
                Title = "Downtime",
                Reason = $"{Minutes(start, end)}-min open slot"
            };
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static WeatherForecast ForecastFor(IReadOnlyList<WeatherForecast> all, DateOnly date) =>
        all.FirstOrDefault(f => f.Date == date)
        ?? new WeatherForecast(date, Array.Empty<string>(), null, null, null, Unavailable: true);
}
