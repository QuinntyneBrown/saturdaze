using System.Globalization;

namespace Saturdaze.Application.Scheduling;

/// <summary>
/// A small, dependency-free cron expression evaluator used by the ingestion
/// Worker to decide when to run. Supports the standard 5-field form
/// (<c>min hour day-of-month month day-of-week</c>) and the 6-field form with a
/// leading seconds field (<c>sec min hour dom mon dow</c>). Each field accepts
/// <c>*</c>, a value, a list (<c>a,b</c>), a range (<c>a-b</c>), and steps
/// (<c>*/n</c>, <c>a-b/n</c>, <c>a/n</c>). Day-of-week is 0-6 with 0 = Sunday
/// (7 is also accepted as Sunday). When both day-of-month and day-of-week are
/// restricted, a date matches if EITHER matches, per standard cron.
/// Occurrences are evaluated in whatever clock the caller supplies; the Worker
/// passes UTC.
/// </summary>
public sealed class CronSchedule
{
    private readonly bool[] _seconds;
    private readonly bool[] _minutes;
    private readonly bool[] _hours;
    private readonly bool[] _daysOfMonth; // index 1..31
    private readonly bool[] _months;      // index 1..12
    private readonly bool[] _daysOfWeek;  // index 0..6 (0 = Sunday)
    private readonly bool _domRestricted;
    private readonly bool _dowRestricted;

    private CronSchedule(
        bool[] seconds, bool[] minutes, bool[] hours,
        bool[] daysOfMonth, bool[] months, bool[] daysOfWeek,
        bool domRestricted, bool dowRestricted)
    {
        _seconds = seconds;
        _minutes = minutes;
        _hours = hours;
        _daysOfMonth = daysOfMonth;
        _months = months;
        _daysOfWeek = daysOfWeek;
        _domRestricted = domRestricted;
        _dowRestricted = dowRestricted;
    }

    public string Expression { get; private init; } = string.Empty;

    public static bool TryParse(string expression, out CronSchedule schedule)
    {
        try
        {
            schedule = Parse(expression);
            return true;
        }
        catch (FormatException)
        {
            schedule = null!;
            return false;
        }
    }

    public static CronSchedule Parse(string expression)
    {
        if (string.IsNullOrWhiteSpace(expression))
            throw new FormatException("Cron expression is empty.");

        var fields = expression.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        string sec, min, hour, dom, mon, dow;
        switch (fields.Length)
        {
            case 6:
                sec = fields[0]; min = fields[1]; hour = fields[2]; dom = fields[3]; mon = fields[4]; dow = fields[5];
                break;
            case 5:
                sec = "0"; min = fields[0]; hour = fields[1]; dom = fields[2]; mon = fields[3]; dow = fields[4];
                break;
            default:
                throw new FormatException(
                    $"Cron expression must have 5 or 6 fields, got {fields.Length}: '{expression}'.");
        }

        return new CronSchedule(
            ParseField(sec, 0, 59),
            ParseField(min, 0, 59),
            ParseField(hour, 0, 23),
            ParseField(dom, 1, 31),
            ParseField(mon, 1, 12),
            ParseField(dow, 0, 6, isDayOfWeek: true),
            domRestricted: !IsWildcard(dom),
            dowRestricted: !IsWildcard(dow))
        {
            Expression = expression.Trim()
        };
    }

    /// <summary>
    /// Returns the next occurrence strictly after <paramref name="after"/>,
    /// at whole-second precision, preserving the <see cref="DateTime.Kind"/> of
    /// the input. Throws if no occurrence exists within five years (a sign of a
    /// contradictory expression such as Feb 30).
    /// </summary>
    public DateTime GetNextOccurrence(DateTime after)
    {
        var horizon = after.AddYears(5);
        var c = new DateTime(after.Year, after.Month, after.Day, after.Hour, after.Minute, after.Second, after.Kind)
            .AddSeconds(1);

        while (true)
        {
            if (c > horizon)
                throw new InvalidOperationException($"Cron '{Expression}' has no occurrence within five years of {after:o}.");

            if (!_months[c.Month])
            {
                c = new DateTime(c.Year, c.Month, 1, 0, 0, 0, c.Kind).AddMonths(1);
                continue;
            }
            if (!IsDayAllowed(c))
            {
                c = c.Date.AddDays(1); // DateTime.Date preserves Kind
                continue;
            }
            if (!_hours[c.Hour])
            {
                c = new DateTime(c.Year, c.Month, c.Day, c.Hour, 0, 0, c.Kind).AddHours(1);
                continue;
            }
            if (!_minutes[c.Minute])
            {
                c = new DateTime(c.Year, c.Month, c.Day, c.Hour, c.Minute, 0, c.Kind).AddMinutes(1);
                continue;
            }
            if (!_seconds[c.Second])
            {
                c = c.AddSeconds(1);
                continue;
            }
            return c;
        }
    }

    public DateTimeOffset GetNextOccurrence(DateTimeOffset after)
    {
        var next = GetNextOccurrence(after.UtcDateTime);
        return new DateTimeOffset(next, TimeSpan.Zero);
    }

    private bool IsDayAllowed(DateTime c)
    {
        var domOk = _daysOfMonth[c.Day];
        var dowOk = _daysOfWeek[(int)c.DayOfWeek];

        if (_domRestricted && _dowRestricted) return domOk || dowOk;
        if (_domRestricted) return domOk;
        if (_dowRestricted) return dowOk;
        return true;
    }

    private static bool IsWildcard(string field) => field is "*" or "?";

    private static bool[] ParseField(string field, int min, int max, bool isDayOfWeek = false)
    {
        var allowed = new bool[max + 1];

        foreach (var part in field.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var rangePart = part;
            var step = 1;

            var slash = part.IndexOf('/');
            if (slash >= 0)
            {
                rangePart = part[..slash];
                if (!int.TryParse(part[(slash + 1)..], NumberStyles.Integer, CultureInfo.InvariantCulture, out step) || step <= 0)
                    throw new FormatException($"Invalid step in cron field '{field}'.");
            }

            int lo, hi;
            if (rangePart is "*" or "?")
            {
                lo = min;
                hi = max;
            }
            else if (rangePart.Contains('-'))
            {
                var ends = rangePart.Split('-', 2);
                lo = ParseValue(ends[0], min, max, isDayOfWeek);
                hi = ParseValue(ends[1], min, max, isDayOfWeek);
            }
            else
            {
                lo = ParseValue(rangePart, min, max, isDayOfWeek);
                // "a/n" with no range end means a..max stepping by n.
                hi = slash >= 0 ? max : lo;
            }

            if (lo > hi)
                throw new FormatException($"Range start exceeds end in cron field '{field}'.");

            for (var v = lo; v <= hi; v += step)
            {
                var idx = isDayOfWeek && v == 7 ? 0 : v;
                allowed[idx] = true;
            }
        }

        return allowed;
    }

    private static int ParseValue(string token, int min, int max, bool isDayOfWeek)
    {
        if (!int.TryParse(token.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var value))
            throw new FormatException($"'{token}' is not a valid cron value.");

        var upper = isDayOfWeek ? 7 : max; // day-of-week tolerates 7 as Sunday
        if (value < min || value > upper)
            throw new FormatException($"Cron value {value} is out of range [{min},{upper}].");

        return value;
    }
}
