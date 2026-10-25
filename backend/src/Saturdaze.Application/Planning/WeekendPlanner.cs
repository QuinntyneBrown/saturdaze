using Saturdaze.Application.AgentPlanning;
using Saturdaze.Application.Catalog;
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

    public IReadOnlyList<ItineraryBlock> Plan(PlannerInputs inputs) => PlanWithPicks(inputs, Array.Empty<DraftPick>());

    /// <summary>
    /// The agents' picks placed first, each as an anchored outing at its start (or the first fit) with
    /// its reason; then the day is filled as <see cref="Plan"/> fills it (L2-202, L2-206). A pick that
    /// does not fit is left out; the validator reports why.
    /// </summary>
    public IReadOnlyList<ItineraryBlock> PlanWithPicks(PlannerInputs inputs, IReadOnlyList<DraftPick> picks)
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
            blocks.AddRange(PlanDay(inputs, day, dayDate, forecast, rng, picked, picks.Where(k => k.Day == day).ToList()));
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
        var scored = ScoreCandidates(inputs, inputs.Activities.Select(PlannerCandidate.From), (gapStart, gapEnd),
            forecast, rejected.ToHashSet(), day);
        if (scored.Count == 0) return null;
        var topScore = scored[0].score;
        var topCandidates = scored.TakeWhile(s => s.score == topScore).Select(s => s.candidate.Id).ToList();
        rng ??= new SeededRandomSource(inputs.Seed);
        var id = topCandidates[rng.Next(topCandidates.Count)];
        return inputs.Activities.First(a => a.Id == id);
    }

    public IReadOnlyList<ItineraryBlock> BuildActivityBlocks(
        Activity activity,
        DayOfWeekend day,
        TimeOnly gapStart,
        TimeOnly gapEnd,
        WeatherForecast forecast,
        bool tryNew)
    {
        var c = PlannerCandidate.From(activity);
        var gap = (gapStart, gapEnd);
        var fit = FitInGap(c, gap, null)
            ?? (gapStart.AddMinutes(c.DriveMinutes), gapEnd.AddMinutes(-c.DriveMinutes));
        return BuildOuting(c, fit, BuildReason(c, forecast, tryNew, gap, fit, null), day).ToList();
    }

    // ─── Day pipeline ────────────────────────────────────────────────────────

    private static IEnumerable<ItineraryBlock> PlanDay(
        PlannerInputs inputs, DayOfWeekend day, DateOnly date, WeatherForecast forecast, IRandomSource rng,
        HashSet<Guid> rejected, IReadOnlyList<DraftPick> picks)
    {
        var profile = inputs.Boundaries;
        var (dayStart, dayEnd) = (profile.DayStart, profile.DayEnd(day));

        var fixedBlocks = BuildFixedBlocks(inputs, day, dayStart, dayEnd);
        EnsureNoOverlap(fixedBlocks, inputs.Commitments);
        fixedBlocks.AddRange(CommitmentDrives(inputs, day, fixedBlocks, dayStart, dayEnd));
        var pool = Candidates(inputs, date).ToList();
        var sunset = inputs.Sunsets?.GetValueOrDefault(day);

        // Meals first (L2-186, L2-187), so outings go around them rather than over them.
        var meals = ReserveMeals(inputs, day, fixedBlocks, dayStart, dayEnd);
        var occupied = fixedBlocks.Concat(meals).ToList();

        // Two passes in time order (L2-184): one outing per long-enough gap, then
        // what is left of a gap, until the day reaches the family's pace.
        var outings = new List<ItineraryBlock>();
        var outingCount = 0;
        var pace = profile.Outings(day);

        // Picks first (L2-202): anchored where the drafter asked, with its reason.
        foreach (var pick in picks)
        {
            if (outingCount >= pace) break;
            var c = pool.FirstOrDefault(x => x.Id == pick.Id
                && (x.Kind == CandidateKind.Event) == (pick.Kind == PickKind.Event));
            if (c is null || rejected.Contains(c.Id) || CandidateFilter.Exclusion(inputs, c, day) is not null) continue;
            var placed = ComputeGaps(occupied, dayStart, dayEnd)
                .Where(g => pick.Start is not { } at || (g.start <= at && at < g.end))
                .Select(g => FitInGap(c, g, sunset, pick.Start))
                .FirstOrDefault(f => f is not null);
            if (placed is not { } pickFit) continue;
            var pickBlocks = BuildOuting(c, pickFit, pick.Reason, day).ToList();
            foreach (var outing in pickBlocks.Where(b => b.Kind == BlockKind.Activity)) outing.PickedByAgents = true;
            outings.AddRange(pickBlocks);
            occupied.AddRange(pickBlocks);
            rejected.Add(c.Id);
            outingCount++;
        }
        for (var pass = 0; pass < 2 && outingCount < pace; pass++)
        {
            var placedThisPass = false;
            foreach (var gap in ComputeGaps(occupied, dayStart, dayEnd)
                         .Where(g => GapMinutes(g) >= PlannerTimes.ActivityMinGapMinutes).ToList())
            {
                if (outingCount >= pace) break;
                var scored = ScoreCandidates(inputs, pool, gap, forecast, rejected, day);
                if (scored.Count == 0) continue;

                var topScore = scored[0].score;
                var top = scored.TakeWhile(s => s.score == topScore).ToList();
                var (winner, _, fit) = top[rng.Next(top.Count)];
                rejected.Add(winner.Id);

                var firstTime = inputs.TryNew && inputs.History.All(h => h.ActivityId != winner.Id);
                var blocks = BuildOuting(winner, fit, BuildReason(winner, forecast, firstTime, gap, fit, sunset), day).ToList();
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
                Reason = "fixed commitment",
                Stop = c.Location?.Copy()
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
                FromCalendar = l.FromCalendar,
                PickedByAgents = l.PickedByAgents
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

    private static bool Splittable(ItineraryBlock a, ItineraryBlock b, IReadOnlyList<Commitment> commitments)
    {
        if (a.Kind != BlockKind.Commitment || b.Kind != BlockKind.Commitment) return false;
        var ca = commitments.FirstOrDefault(c => Represents(a, c) && c.Title == a.Title);
        var cb = commitments.FirstOrDefault(c => Represents(b, c) && c.Title == b.Title);
        return ca is { AttendeeMemberIds.Count: > 0 } && cb is { AttendeeMemberIds.Count: > 0 }
               && !ca.AttendeeMemberIds.Intersect(cb.AttendeeMemberIds).Any();
    }

    /// <summary>Commitments at one place less than this apart share the drives (L2-193).</summary>
    private const int SharedDriveGapMinutes = 30;

    /// <summary>
    /// "Drive to {title}" before and "Drive home from {title}" after each run of commitments at
    /// one place (L2-193), as long as the family's drive, clipped so no drive overlaps a fixed block.
    /// </summary>
    private static IEnumerable<ItineraryBlock> CommitmentDrives(
        PlannerInputs inputs, DayOfWeekend day, IReadOnlyList<ItineraryBlock> fixedBlocks, TimeOnly dayStart, TimeOnly dayEnd)
    {
        var located = fixedBlocks
            .Where(b => b.Kind == BlockKind.Commitment && b.Stop is not null)
            .OrderBy(b => b.StartTime)
            .ToList();
        var runs = new List<List<ItineraryBlock>>();
        foreach (var b in located)
        {
            var run = runs.LastOrDefault();
            if (run is not null && run[0].Stop!.SameAs(b.Stop) && Minutes(run.Max(r => r.EndTime), b.StartTime) < SharedDriveGapMinutes)
                run.Add(b);
            else
                runs.Add(new List<ItineraryBlock> { b });
        }

        foreach (var run in runs)
        {
            var drive = Math.Max(1, FamilyDriveTime.Minutes(inputs.Home, run[0].Stop, 0));
            var start = run.Min(r => r.StartTime);
            var end = run.Max(r => r.EndTime);
            var before = fixedBlocks.Where(b => b.EndTime <= start).Select(b => b.EndTime).DefaultIfEmpty(dayStart).Max();
            var after = fixedBlocks.Where(b => b.StartTime >= end).Select(b => b.StartTime).DefaultIfEmpty(dayEnd).Min();

            var leave = Max(start.AddMinutes(-drive), Max(before, dayStart));
            if (leave < start)
                yield return new ItineraryBlock
                {
                    Id = Guid.NewGuid(), Day = day, StartTime = leave, EndTime = start, Kind = BlockKind.Drive,
                    Title = $"Drive to {run[0].Title}", Reason = $"{drive} min drive"
                };
            var home = Min(end.AddMinutes(drive), Min(after, dayEnd));
            if (home > end)
                yield return new ItineraryBlock
                {
                    Id = Guid.NewGuid(), Day = day, StartTime = end, EndTime = home, Kind = BlockKind.Drive,
                    Title = $"Drive home from {run[^1].Title}", Reason = $"{drive} min drive"
                };
        }
    }

    private static TimeOnly Max(TimeOnly a, TimeOnly b) => a > b ? a : b;
    private static TimeOnly Min(TimeOnly a, TimeOnly b) => a < b ? a : b;

    private static bool Represents(ItineraryBlock block, Commitment commitment) =>
        string.Equals(block.Title, commitment.Title, StringComparison.OrdinalIgnoreCase)
        || Overlaps(block.StartTime, block.EndTime, commitment.StartTime, commitment.EndTime);

    private static void EnsureNoOverlap(IReadOnlyList<ItineraryBlock> blocks, IReadOnlyList<Commitment> commitments)
    {
        for (var i = 1; i < blocks.Count; i++)
        {
            // Commitments with different people going may overlap (L2-192): they share the span.
            if (Splittable(blocks[i - 1], blocks[i], commitments)) continue;
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

    // ─── Candidates and scoring ───────────────────────────────────────────────

    private const int LeaningBonus = 3;
    private const int LikeBonus = 3;
    private const int InterestBonus = 2;

    /// <summary>"On this weekend only" (L2-201).</summary>
    private const int EventBonus = 3;

    /// <summary>The day's candidates: every activity, and the published events running that date (L2-201).</summary>
    private static IEnumerable<PlannerCandidate> Candidates(PlannerInputs inputs, DateOnly date) => CandidateFilter.All(inputs, date);

    /// <summary>
    /// The candidates that fit <paramref name="gap"/> on <paramref name="date"/>, best first, each
    /// with the window it would take (L2-200: hours, season, event times, daylight).
    /// </summary>
    private static List<(PlannerCandidate candidate, int score, (TimeOnly start, TimeOnly end) fit)> ScoreCandidates(
        PlannerInputs inputs, IEnumerable<PlannerCandidate> pool, (TimeOnly start, TimeOnly end) gap,
        WeatherForecast forecast, ISet<Guid> alreadyPicked, DayOfWeekend day)
    {
        var date = day == DayOfWeekend.Saturday ? inputs.WeekendOf : inputs.WeekendOf.AddDays(1);
        var minutes = GapMinutes(gap);
        var likedTags = inputs.Preferences.Where(p => p.Kind == PreferenceKind.Like).Select(p => p.Value).ToList();

        // "Skipping next time" (L2-027 AC3): an activity from a weekend the family
        // rated 2★ or lower is not planned again.
        var skipped = inputs.History
            .Where(h => h.Rating is <= SkipRatingCeiling)
            .Select(h => h.ActivityId)
            .ToHashSet();

        var profile = inputs.Boundaries;
        var sunset = inputs.Sunsets?.GetValueOrDefault(day);
        var results = new List<(PlannerCandidate, int, (TimeOnly, TimeOnly))>();
        foreach (var c in pool)
        {
            if (alreadyPicked.Contains(c.Id)) continue;
            if (skipped.Contains(c.Id)) continue;
            // Drive (L2-191), themes (L2-194), dislikes, ages, season (L2-200), event days (L2-201).
            if (CandidateFilter.Exclusion(inputs, c, day) is not null) continue;
            if (c.Kind == CandidateKind.Activity && c.DurationMinutes > minutes) continue;
            var ageOutside = inputs.Members.Count(m => m.Age < c.MinAge || m.Age > c.MaxAge);
            if (FitInGap(c, gap, sunset) is not { } fit) continue;

            var score = 0;

            // Weather fit (only if forecast available).
            if (!forecast.Unavailable)
            {
                if (forecast.Tags.Contains("rain") && c.Indoor == true) score += 3;
                if ((forecast.Tags.Contains("sunny") || forecast.Tags.Contains("warm")) && c.Indoor == false) score += 2;
                if (forecast.Tags.Contains("snow") && c.Indoor == true) score += 3;
            }

            // Drive fit.
            if (c.DriveMinutes * 2 > minutes * 0.4) score -= 2;

            // Age fit.
            if (ageOutside == 0) score += 2;

            score += RecencyScore(inputs, c.Id);
            if (inputs.TryNew && inputs.History.All(h => h.ActivityId != c.Id)) score += 3;

            // Leaning (L2-195), likes and interests (L2-196): two matching likes beat the rain bonus.
            if ((profile.Leaning == PlanLeaning.Indoor && c.Indoor == true) || (profile.Leaning == PlanLeaning.Outdoor && c.Indoor == false))
                score += LeaningBonus;
            score += LikeBonus * likedTags.Count(t => CandidateFilter.Matches(c, t));
            score += InterestBonus * inputs.Members.Count(m => m.Interests.Any(i => CandidateFilter.Matches(c, i)));
            if (c.Kind == CandidateKind.Event) score += EventBonus;

            results.Add((c, score, fit));
        }

        // Stable sort: highest score first, tie-break by name for determinism before rng pick.
        return results.OrderByDescending(r => r.Item2).ThenBy(r => r.Item1.Name).ToList();
    }

    /// <summary>
    /// Where a candidate goes in a gap: after the drive, not before it opens or its event starts;
    /// ending by the drive home, its closing time, its event's end and, outdoors and untimed,
    /// sunset (L2-200, L2-201). Null when too little of it fits.
    /// </summary>
    internal static (TimeOnly start, TimeOnly end)? FitInGap(
        PlannerCandidate c, (TimeOnly start, TimeOnly end) gap, TimeOnly? sunset, TimeOnly? preferredStart = null)
    {
        var drive = Math.Max(0, c.DriveMinutes);
        if (gap.start.AddMinutes(drive) >= gap.end) return null;

        var earliest = gap.start.AddMinutes(drive);
        var latestEnd = gap.end.AddMinutes(-drive);
        if (latestEnd <= earliest) return null;

        if (c.OpensAt is { } opens && opens > earliest) earliest = opens;
        if (c.ClosesAt is { } closes && closes < latestEnd) latestEnd = closes;
        if (c.IsTimedEvent)
        {
            if (c.StartTime!.Value > earliest) earliest = c.StartTime.Value;
            if (c.EndTime!.Value < latestEnd) latestEnd = c.EndTime.Value;
        }
        else if (c.Kind == CandidateKind.Event)
        {
            if (PlannerCandidate.UntimedEventFrom > earliest) earliest = PlannerCandidate.UntimedEventFrom;
            if (PlannerCandidate.UntimedEventUntil < latestEnd) latestEnd = PlannerCandidate.UntimedEventUntil;
        }
        if (c.IsOutdoor && !c.IsTimedEvent && sunset is { } dusk && dusk < latestEnd) latestEnd = dusk;

        if (preferredStart is { } wanted && wanted > earliest) earliest = wanted;
        var want = c.Kind == CandidateKind.Event
            ? PlannerCandidate.EventMinutes
            : Math.Max(c.DurationMinutes, PlannerTimes.ActivityMinMinutes);
        var start = earliest;
        var end = start.AddMinutes(want);
        if (end > latestEnd || end < start) end = latestEnd;

        var least = c.Kind == CandidateKind.Event ? PlannerCandidate.EventMinMinutes : PlannerTimes.ActivityMinMinutes;
        if (end <= start || Minutes(start, end) < least) return null;
        return (start, end);
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

    // ─── Outing placement with drive blocks ───────────────────────────────────

    /// <summary>The drive there, the outing, and the drive home, around the fitted window.</summary>
    private static IEnumerable<ItineraryBlock> BuildOuting(
        PlannerCandidate c, (TimeOnly start, TimeOnly end) fit, string reason, DayOfWeekend day)
    {
        var drive = Math.Max(0, c.DriveMinutes);
        if (drive > 0)
        {
            yield return new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                Day = day,
                StartTime = fit.start.AddMinutes(-drive),
                EndTime = fit.start,
                Kind = BlockKind.Drive,
                Title = $"Drive to {c.Name}",
                Reason = $"{drive} min drive"
            };
        }

        yield return new ItineraryBlock
        {
            Id = Guid.NewGuid(),
            Day = day,
            StartTime = fit.start,
            EndTime = fit.end,
            Kind = BlockKind.Activity,
            Title = c.Name,
            RefId = c.Id,
            Reason = reason,
            Stop = c.Geo?.Copy()
        };

        if (drive > 0)
        {
            yield return new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                Day = day,
                StartTime = fit.end,
                EndTime = fit.end.AddMinutes(drive),
                Kind = BlockKind.Drive,
                Title = $"Drive home from {c.Name}",
                Reason = $"{drive} min drive"
            };
        }
    }

    /// <param name="firstTime">True only when the try-new bonus applied: the family never had it (L2-189).</param>
    private static string BuildReason(
        PlannerCandidate c, WeatherForecast forecast, bool firstTime, (TimeOnly start, TimeOnly end) gap,
        (TimeOnly start, TimeOnly end) fit, TimeOnly? sunset)
    {
        var parts = new List<string>();
        if (c.Kind == CandidateKind.Event) parts.Add("on this weekend only");
        if (forecast.Unavailable) parts.Add("weather unavailable");
        else
        {
            if (forecast.Tags.Contains("rain") && c.Indoor == true) parts.Add("indoor pick — rain in forecast");
            else if ((forecast.Tags.Contains("sunny") || forecast.Tags.Contains("warm")) && c.Indoor == false)
                parts.Add("outdoor pick — fair weather");
            else if (forecast.Tags.Contains("snow") && c.Indoor == true) parts.Add("indoor pick — snow in forecast");
        }
        if (firstTime) parts.Add("first time trying this — variety on");
        if (c.OpensAt is { } opens && c.ClosesAt is { } closes && (fit.start == opens || fit.end == closes))
            parts.Add($"open {opens:H\\:mm}–{closes:H\\:mm}");
        if (c.IsOutdoor && !c.IsTimedEvent && sunset is { } dusk && fit.end == dusk)
            parts.Add($"back before sunset {dusk:H\\:mm}");
        if (c.Kind == CandidateKind.Activity)
            parts.Add($"fits {c.DurationMinutes}-min window in {GapMinutes(gap)}-min gap");
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
