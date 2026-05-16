using Saturdaze.Application.Common;

namespace Saturdaze.Api.Tests.Support;

public sealed class FakeDateTimeProvider : IDateTimeProvider
{
    public FakeDateTimeProvider(DateOnly today) => Today = today;
    public DateOnly Today { get; set; }
    public DateTimeOffset UtcNow => Today.ToDateTime(TimeOnly.MinValue);
}
