using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Calendar;

/// <summary>
/// Which blocks of a weekend become calendar events, in the subscription link
/// (L2-178) and in a connected Google Calendar (L2-175): everything except
/// drives, downtime and events that came from a calendar, which are already in
/// someone's calendar and stay out of an anonymous feed (L2-176).
/// </summary>
public static class CalendarEventSelection
{
    public static bool Includes(ItineraryBlock block) =>
        block.Kind is not (BlockKind.Drive or BlockKind.Downtime) && !block.FromCalendar;
}
