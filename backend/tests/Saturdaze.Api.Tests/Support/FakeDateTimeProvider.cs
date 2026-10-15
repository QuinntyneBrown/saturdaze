using Saturdaze.Application.Common;

namespace Saturdaze.Api.Tests.Support;

public sealed class FakeDateTimeProvider : IDateTimeProvider
{
    public FakeDateTimeProvider(DateOnly today) => Today = today;
    public DateOnly Today { get; set; }
    /// <summary>Minutes past midnight UTC on <see cref="Today"/>; tests that care about the time of day move it.</summary>
    public TimeSpan TimeOfDay { get; set; }
    // Explicit UTC offset: an Unspecified DateTime would pick up the machine's local offset.
    public DateTimeOffset UtcNow => new DateTimeOffset(Today.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero) + TimeOfDay;
}
