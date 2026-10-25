using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Travel;
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
    /// <summary>The rating at or below which a weekend's activities are skipped (matches the /past strip).</summary>
    private const int SkipRatingCeiling = 2;

    public IReadOnlyList<ItineraryBlock> Plan(PlannerInputs inputs)
    {
        var rng = new SeededRandomSource(inputs.Seed);
        var blocks = new List<ItineraryBlock>();
        // One weekend, one visit per place (L2-185): Sunday never repeats Saturday,
        // and a locked activity counts as already picked.
        var picked = inputs.LockedBlocks
            .Where(b => b.Kind == BlockKind.Activity && b.RefId is not null)
            .Select(b => b.RefId!.Value)
            .ToHashSet();
        foreach (var day in new[] { DayOfWeekend.Saturday, DayOfWeekend.Sunday })
        {
            var dayDate = day == DayOfWeekend.Saturday ? inputs.WeekendOf : inputs.WeekendOf.AddDays(1);
            var forecast = ForecastFor(inputs.Forecast, dayDate);
            blocks.AddRange(PlanDay(inputs, day, dayDate, forecast, rng, picked));
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
        PlannerInputs inputs, DayOfWeekend day, DateOnly date, WeatherForecast forecast, IRandomSource rng,
        HashSet<Guid> rejected)
    {
        var profile = inputs.Boundaries;
        var (dayStart, dayEnd) = (profile.DayStart, profile.DayEnd(day));

        var fixedBlocks = BuildFixedBlocks(inputs, day, dayStart, dayEnd);
        EnsureNoOverlap(fixedBlocks);

        // Meals first (L2-186, L2-187), so outings go around them rather than over them.
        var meals = ReserveMeals(inputs, day, fixedBlocks, dayStart, dayEnd);
        var occupied = fixedBlocks.Concat(meals).ToList();

        // Two passes in time order (L2-184): one outing per long-enough gap, then
        // what is left of a gap, until the day reaches the family's pace.
        var outings = new List<ItineraryBlock>();
        var outingCount = 0;
        var pace = profile.Outings(day);
        for (var pass = 0; pass < 2 && outingCount < pace; pass++)
        {
            var placedThisPass = false;
            foreach (var gap in ComputeGaps(occupied, dayStart, dayEnd)
                         .Where(g => GapMinutes(g) >= PlannerTimes.ActivityMinGapMinutes).ToList())
            {
                if (outingCount >= pace) break;
                var scored = ScoreActivities(inputs, gap, forecast, rejected, day);
                if (scored.Count == 0) continue;

                var topScore = scored[0].score;
                var topCandidates = scored.TakeWhile(s => s.score == topScore).Select(s => s.activity).ToList();
                var winner = topCandidates[rng.Next(topCandidates.Count)];
                rejected.Add(winner.Id);

                var firstTime = inputs.TryNew && inputs.History.All(h => h.ActivityId != winner.Id);
                var blocks = BuildActivityWithDrives(winner, gap, forecast, firstTime, day).ToList();
                outings.AddRange(blocks);
                occupied.AddRange(blocks);
                outingCount++;
                placedThisPass = true;
            }
            if (!placedThisPass) break;
        }

        var result = new List<ItineraryBlock>(fixedBlocks);
        result.AddRange(outings);
        result.AddRange(AssignRestaurants(inputs, meals, result));
        result = result.OrderBy(b => b.StartTime).ToList();

        if (day == DayOfWeekend.Saturday && inputs.Errand is not null)
        {
            var errandBlock = PlaceErrandCore(inputs.Errand, result, day, dayStart, dayEnd);
            if (errandBlock is not null) result.Add(errandBlock);
        }

        result = result.OrderBy(b => b.StartTime).ToList();
        result.AddRange(Downtime(day, result, dayStart, dayEnd));

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

    private static List<ItineraryBlock> BuildFixedBlocks(
        PlannerInputs inputs, DayOfWeekend day, TimeOnly dayStart, TimeOnly dayEnd)
    {
        var dow = day == DayOfWeekend.Saturday ? DayOfWeek.Saturday : DayOfWeek.Sunday;
        var locked = inputs.LockedBlocks.Where(b => b.Day == day).ToList();
        var commitments = inputs.Commitments.Where(c => c.DayOfWeek == dow);

        var list = new List<ItineraryBlock>();
        foreach (var c in commitments)
        {
            // A commitment already on the weekend keeps its block (L2-011 AC2).
            if (locked.Any(l => l.Kind == BlockKind.Commitment && Represents(l, c))) continue;
            list.Add(new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                Day = day,
                StartTime = c.StartTime,
                EndTime = c.EndTime,
                Kind = BlockKind.Commitment,
                Title = c.Title,
                IsLocked = true, // L2-011: commitments never move
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
                Reason = string.IsNullOrEmpty(l.Reason) ? "locked by user" : l.Reason,
                Stop = l.Stop?.Copy(),
                FromCalendar = l.FromCalendar
            });
        }

        // Calendar events go last, so profile commitments and locked blocks win
        // and fixed blocks never overlap (L2-177).
        var calendar = (inputs.CalendarCommitments ?? Array.Empty<CalendarCommitment>())
            .Where(c => c.Day == day)
            .Select(c => (c, start: Max(c.Start, dayStart), end: Min(c.End, dayEnd)))
            .Where(x => x.start < x.end)
            .OrderBy(x => x.start);
        foreach (var (c, start, end) in calendar)
        {
            if (list.Any(b => Overlaps(b.StartTime, b.EndTime, start, end))) continue;
            list.Add(new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                Day = day,
                StartTime = start,
                EndTime = end,
                Kind = BlockKind.Commitment,
                Title = c.Title,
                IsLocked = true,
                Reason = "from your calendar",
                FromCalendar = true
            });
        }
        return list.OrderBy(b => b.StartTime).ToList();
    }

    private static TimeOnly Max(TimeOnly a, TimeOnly b) => a > b ? a : b;
    private static TimeOnly Min(TimeOnly a, TimeOnly b) => a < b ? a : b;

    private static bool Represents(ItineraryBlock block, Commitment commitment) =>
        string.Equals(block.Title, commitment.Title, StringComparison.OrdinalIgnoreCase)
        || Overlaps(block.StartTime, block.EndTime, commitment.StartTime, commitment.EndTime);

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

    private static List<(TimeOnly start, TimeOnly end)> ComputeGaps(
        IReadOnlyList<ItineraryBlock> occupied, TimeOnly dayStart, TimeOnly dayEnd)
    {
        var gaps = new List<(TimeOnly start, TimeOnly end)>();
        var cursor = dayStart;
        foreach (var b in occupied.OrderBy(b => b.StartTime))
        {
            if (cursor < b.StartTime) gaps.Add((cursor, b.StartTime));
            if (b.EndTime > cursor) cursor = b.EndTime;
        }
        if (cursor < dayEnd) gaps.Add((cursor, dayEnd));
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

        // "Skipping next time" (L2-027 AC3): an activity from a weekend the family
        // rated 2★ or lower is not planned again.
        var skipped = inputs.History
            .Where(h => h.Rating is <= SkipRatingCeiling)
            .Select(h => h.ActivityId)
            .ToHashSet();

        var profile = inputs.Boundaries;
        var results = new List<(Activity, int)>();
        foreach (var act in inputs.Activities)
        {
            if (alreadyPicked.Contains(act.Id)) continue;
            if (skipped.Contains(act.Id)) continue;
            if (act.DriveMinutes > profile.MaxDriveMinutes) continue; // L2-191
            if (act.TypicalDurationMinutes > minutes) continue;
            // Both drives plus a minimum stay must fit, otherwise the drive-clamp
            // in BuildActivityWithDrives would produce an activity that ends
            // before it starts.
            if (act.DriveMinutes * 2 + PlannerTimes.ActivityMinMinutes > minutes) continue;

            // Disqualifying conditions first.
            if (dislikedTags.Any(d => Disliked(act, d))) continue;
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

            // Leaning (L2-195), likes and interests (L2-196): two matching likes beat the rain bonus.
            if ((profile.Leaning == PlanLeaning.Indoor && act.Indoor) || (profile.Leaning == PlanLeaning.Outdoor && !act.Indoor))
                score += LeaningBonus;
            score += LikeBonus * likedTags.Count(t => MatchesTag(act, t));
            score += InterestBonus * inputs.Members.Count(m => m.Interests.Any(i => MatchesTag(act, i)));

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

    private const int LeaningBonus = 3;
    private const int LikeBonus = 3;
    private const int InterestBonus = 2;

    /// <summary>A dislike of "Indoor" or "Outdoor" reads the place's flag (L2-194 AC5); others match text.</summary>
    private static bool Disliked(Activity act, string dislike) =>
        string.Equals(dislike.Trim(), "Indoor", StringComparison.OrdinalIgnoreCase) ? act.Indoor
        : string.Equals(dislike.Trim(), "Outdoor", StringComparison.OrdinalIgnoreCase) ? !act.Indoor
        : MatchesTag(act, dislike);

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
            Reason = BuildActivityReason(act, forecast, tryNew, GapMinutes(gap)),
            Stop = act.Geo?.Copy()
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

    /// <param name="firstTime">True only when the try-new bonus applied: the family never had it (L2-189).</param>
    private static string BuildActivityReason(Activity act, WeatherForecast forecast, bool firstTime, int gapMinutes)
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
        if (firstTime) parts.Add("first time trying this — variety on");
        parts.Add($"fits {act.TypicalDurationMinutes}-min window in {gapMinutes}-min gap");
        return string.Join("; ", parts);
    }

    // ─── Meals ────────────────────────────────────────────────────────────────

    private static readonly string[] MealWords = { "lunch", "brunch", "dinner", "supper" };

    /// <summary>
    /// Holds each meal's hour before outings are placed (L2-186): the first free
    /// quarter-hour start found going forward from the preferred time to the
    /// window's latest start, then back to its earliest. A meal that does not fit
    /// its window is left out, never moved. Restaurants are chosen afterwards.
    /// </summary>
    private static List<ItineraryBlock> ReserveMeals(
        PlannerInputs inputs, DayOfWeekend day, IReadOnlyList<ItineraryBlock> fixedBlocks,
        TimeOnly dayStart, TimeOnly dayEnd)
    {
        var profile = inputs.Boundaries;
        var meals = new List<ItineraryBlock>();
        foreach (var (slot, earliest, preferred, latest) in new[]
        {
            (MealSlot.Lunch, PlannerTimes.LunchEarliestStart, PlannerTimes.LunchWindowStart, PlannerTimes.LunchLatestStart),
            (MealSlot.Dinner, PlannerTimes.DinnerEarliestStart, PlannerTimes.DinnerWindowStart, PlannerTimes.DinnerLatestStart)
        })
        {
            var atHome = slot == MealSlot.Dinner && day == DayOfWeekend.Sunday && profile.SundayDinnerAtHome;
            if (!atHome && !EligibleRestaurants(inputs, slot).Any()) continue;

            // "Lunch at Grandma's" is the lunch.
            var windowEnd = latest.AddMinutes(PlannerTimes.MealMinutes);
            if (fixedBlocks.Any(b => b.Kind == BlockKind.Commitment
                                     && Overlaps(b.StartTime, b.EndTime, earliest, windowEnd)
                                     && MealWords.Any(w => b.Title.Contains(w, StringComparison.OrdinalIgnoreCase))))
                continue;

            var taken = fixedBlocks.Concat(meals).ToList();
            var start = MealStarts(earliest, preferred, latest)
                .Cast<TimeOnly?>()
                .FirstOrDefault(t => t!.Value >= dayStart
                                     && t.Value.AddMinutes(PlannerTimes.MealMinutes) <= dayEnd
                                     && !taken.Any(b => Overlaps(b.StartTime, b.EndTime, t.Value, t.Value.AddMinutes(PlannerTimes.MealMinutes))));
            if (start is null) continue;

            meals.Add(new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                Day = day,
                StartTime = start.Value,
                EndTime = start.Value.AddMinutes(PlannerTimes.MealMinutes),
                Kind = BlockKind.Meal,
                Title = atHome ? "Dinner at home" : slot.ToString(),
                Reason = atHome ? "Sunday dinner at home" : string.Empty
            });
        }
        return meals;
    }

    private static IEnumerable<TimeOnly> MealStarts(TimeOnly earliest, TimeOnly preferred, TimeOnly latest)
    {
        for (var t = preferred; t <= latest; t = t.AddMinutes(15)) yield return t;
        for (var t = preferred.AddMinutes(-15); t >= earliest; t = t.AddMinutes(-15)) yield return t;
    }

    private static IEnumerable<Restaurant> EligibleRestaurants(PlannerInputs inputs, MealSlot slot) =>
        inputs.Restaurants.Where(r => r.Slot == slot && r.WifeApproved && r.DriveMinutes <= inputs.Boundaries.MaxDriveMinutes);

    /// <summary>
    /// Puts a restaurant on each reserved meal: the eligible one nearest the stop
    /// before it, or nearest home (L2-186). A meal with no restaurant is dropped.
    /// </summary>
    private static IEnumerable<ItineraryBlock> AssignRestaurants(
        PlannerInputs inputs, IReadOnlyList<ItineraryBlock> meals, IReadOnlyList<ItineraryBlock> placed)
    {
        foreach (var meal in meals)
        {
            if (meal.RefId is null && meal.Title == "Dinner at home")
            {
                yield return meal;
                continue;
            }

            var slot = meal.Title == nameof(MealSlot.Lunch) ? MealSlot.Lunch : MealSlot.Dinner;
            var candidates = EligibleRestaurants(inputs, slot).ToList();
            if (candidates.Count == 0) continue;

            var anchor = placed
                .Where(b => b.Stop is not null && b.EndTime <= meal.StartTime && b.Kind != BlockKind.Meal)
                .OrderBy(b => b.EndTime)
                .LastOrDefault();
            var from = anchor?.Stop ?? inputs.Home;
            var restaurant = from is null
                ? candidates.OrderBy(r => r.DriveMinutes).ThenBy(r => r.Name).First()
                : candidates
                    .OrderBy(r => r.Geo is null ? decimal.MaxValue : TravelEstimator.DistanceKm(from, r.Geo))
                    .ThenBy(r => r.DriveMinutes)
                    .ThenBy(r => r.Name)
                    .First();

            meal.Title = $"{slot}: {restaurant.Name}";
            meal.RefId = restaurant.Id;
            meal.Reason = anchor is null ? "near home" : $"near {anchor.Title}";
            meal.Stop = restaurant.Geo?.Copy();
            yield return meal;
        }
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

    // ─── Errand placement ─────────────────────────────────────────────────────

    public ItineraryBlock? PlaceErrand(ShoppingErrand errand, IReadOnlyList<ItineraryBlock> dayBlocks, DayOfWeekend day)
        => PlaceErrandCore(errand, dayBlocks, day, PlannerProfile.Default.DayStart, PlannerProfile.Default.DayEnd(day));

    private static ItineraryBlock? PlaceErrandCore(
        ShoppingErrand errand, IReadOnlyList<ItineraryBlock> dayBlocks, DayOfWeekend day, TimeOnly dayStart, TimeOnly dayEnd)
    {
        var neededMinutes = errand.EstimatedMinutes + PlannerTimes.ErrandBufferMinutes;
        // Downtime is exactly the space an errand should take over.
        var sorted = dayBlocks
            .Where(b => b.Day == day && b.Kind != BlockKind.Downtime)
            .OrderBy(b => b.StartTime)
            .ToList();

        var ranges = FindFreeRanges(sorted, dayStart, dayEnd, neededMinutes);
        if (ranges.Count == 0) return null;

        // Prefer the morning (before noon), choosing smallest-fit gap to leave room.
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
                ? $"errand placed {day} morning"
                : "errand placed in next-best slot"
        };
    }

    // ─── Downtime ─────────────────────────────────────────────────────────────

    public IReadOnlyList<ItineraryBlock> FillDowntime(DayOfWeekend day, IReadOnlyList<ItineraryBlock> dayBlocks)
        => Downtime(day, dayBlocks, PlannerProfile.Default.DayStart, PlannerProfile.Default.DayEnd(day)).ToList();

    private static IEnumerable<ItineraryBlock> Downtime(
        DayOfWeekend day, IReadOnlyList<ItineraryBlock> placed, TimeOnly dayStart, TimeOnly dayEnd)
    {
        var sorted = placed.Where(b => b.Day == day).OrderBy(b => b.StartTime).ToList();
        foreach (var (start, end) in FindFreeRanges(sorted, dayStart, dayEnd, PlannerTimes.DowntimeMinMinutes))
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
