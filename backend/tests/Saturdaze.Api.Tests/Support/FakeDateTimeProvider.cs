using Saturdaze.Application.Common;

namespace Saturdaze.Api.Tests.Support;

public sealed class FakeDateTimeProvider : IDateTimeProvider
{
    public FakeDateTimeProvider(DateOnly today) => Today = today;
    public DateOnly Today { get; set; }
    // Explicit UTC offset: an Unspecified DateTime would pick up the machine's local offset.
    public DateTimeOffset UtcNow => new(Today.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
}
