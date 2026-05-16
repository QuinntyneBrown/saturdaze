namespace Saturdaze.Application.Common;

public interface IDateTimeProvider
{
    DateTimeOffset UtcNow { get; }
    DateOnly Today { get; }
}

public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
    public DateOnly Today => DateOnly.FromDateTime(DateTime.Now);
}
