using MediatR;
using Microsoft.Extensions.Logging;
using Saturdaze.Application.Common;

namespace Saturdaze.Application.Calendar;

/// <summary>
/// After a command that changes the current weekend succeeds, schedules a write
/// to the family's connected calendars (L2-176). Scheduling never fails the
/// family's request (L2-178).
/// </summary>
public sealed class CalendarSyncBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ICurrentFamilyAccessor _current;
    private readonly CalendarSyncScheduler _scheduler;
    private readonly ILogger<CalendarSyncBehavior<TRequest, TResponse>> _logger;

    public CalendarSyncBehavior(
        ICurrentFamilyAccessor current,
        CalendarSyncScheduler scheduler,
        ILogger<CalendarSyncBehavior<TRequest, TResponse>> logger)
    {
        _current = current;
        _scheduler = scheduler;
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var response = await next(cancellationToken);
        if (request is not IChangesItinerary) return response;

        try
        {
            await _scheduler.RequestAsync(await _current.GetCurrentFamilyIdAsync(cancellationToken), cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning("Calendar sync could not be scheduled after {Request}: {Error}",
                typeof(TRequest).Name, ex.GetType().Name);
        }
        return response;
    }
}
