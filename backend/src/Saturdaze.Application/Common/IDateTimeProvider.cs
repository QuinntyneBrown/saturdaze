using Microsoft.Extensions.Options;

namespace Saturdaze.Application.Common;

public interface IDateTimeProvider
{
    DateTimeOffset UtcNow { get; }

    /// <summary>Today in the family's time zone (see <see cref="TimeOptions"/>), not the server's.</summary>
    DateOnly Today { get; }
}

/// <summary>
/// <c>Saturdaze:Time:TimeZone</c>. Defaults to Toronto so "the upcoming
/// Saturday" flips at local midnight even when the API runs on a UTC host.
/// </summary>
public sealed class TimeOptions
{
    public const string SectionName = "Saturdaze:Time";

    public string TimeZone { get; set; } = "America/Toronto";
}

public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    private readonly TimeZoneInfo _zone;

    public SystemDateTimeProvider() : this(Options.Create(new TimeOptions())) { }

    public SystemDateTimeProvider(IOptions<TimeOptions> options)
    {
        _zone = Resolve(options.Value.TimeZone);
    }

    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;

    public DateOnly Today => DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, _zone).DateTime);

    private static TimeZoneInfo Resolve(string id)
    {
        if (string.IsNullOrWhiteSpace(id)) return TimeZoneInfo.Utc;
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(id);
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.Utc;
        }
        catch (InvalidTimeZoneException)
        {
            return TimeZoneInfo.Utc;
        }
    }
}
