namespace Saturdaze.Application.Contracts;

public sealed record WeekendShareDto(string ShareUrl, string Token);

public sealed record CalendarLinksDto(string IcsUrl, string WebcalUrl, string GoogleCalendarUrl);
