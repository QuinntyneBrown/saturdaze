using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Calendar;

namespace Saturdaze.Infrastructure.Calendar;

/// <summary>
/// Writes changed weekends to connected Google Calendars off the request path
/// (ADR-021, decision 4), beside <c>EmailDispatchService</c>. It wakes on
/// <see cref="CalendarSyncSignal"/> or every <see cref="CalendarOptions.PollSeconds"/>,
/// so a retry that comes due, or work left by a restart, is picked up.
/// </summary>
public sealed class CalendarSyncService : BackgroundService
{
    private readonly CalendarSyncSignal _signal;
    private readonly IServiceScopeFactory _scopes;
    private readonly CalendarOptions _options;
    private readonly ILogger<CalendarSyncService> _logger;

    public CalendarSyncService(
        CalendarSyncSignal signal,
        IServiceScopeFactory scopes,
        IOptions<CalendarOptions> options,
        ILogger<CalendarSyncService> logger)
    {
        _signal = signal;
        _scopes = scopes;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var poll = TimeSpan.FromSeconds(Math.Max(1, _options.PollSeconds));
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await _signal.WaitAsync(poll, stoppingToken);
                using var scope = _scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<CalendarSyncRunner>().RunDueAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                // The database may be briefly unavailable; the next pass tries again.
                _logger.LogError("Calendar sync pass failed: {Error}", ex.GetType().Name);
            }
        }
    }
}
