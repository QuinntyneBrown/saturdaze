using Saturdaze.Application.Calendar;

namespace Saturdaze.Infrastructure.Calendar;

/// <summary>Wakes <see cref="CalendarSyncService"/> early; any number of notifications collapse into one wake.</summary>
public sealed class CalendarSyncSignal : ICalendarSyncSignal
{
    private readonly SemaphoreSlim _wake = new(0, 1);

    public void Notify()
    {
        try
        {
            _wake.Release();
        }
        catch (SemaphoreFullException)
        {
            // Already signalled; the next pass picks up every pending connection.
        }
    }

    public Task<bool> WaitAsync(TimeSpan timeout, CancellationToken ct) => _wake.WaitAsync(timeout, ct);
}
