using Saturdaze.Application.Common;

namespace Saturdaze.Application.Tests.Support;

internal sealed class StubDateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow { get; set; } = new(2026, 5, 18, 12, 0, 0, TimeSpan.Zero);
    public DateOnly Today { get; set; } = new(2026, 5, 18);
}
