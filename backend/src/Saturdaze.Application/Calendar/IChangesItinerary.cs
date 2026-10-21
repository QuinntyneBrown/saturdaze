namespace Saturdaze.Application.Calendar;

/// <summary>
/// Marks a command that changes the family's current weekend; after it succeeds
/// <see cref="CalendarSyncBehavior{TRequest,TResponse}"/> schedules a write to
/// every connected Google Calendar in the family (L2-168).
/// </summary>
public interface IChangesItinerary;
