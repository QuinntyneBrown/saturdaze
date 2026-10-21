using System.Text;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Api.Controllers;

/// <summary>
/// Writes itinerary blocks as an iCalendar file: the family's export and the
/// share link's calendar (L2-086), and the subscription link (L2-178).
/// </summary>
internal static class IcsWriter
{
    /// <summary>One VEVENT per block; titles only, no reasons (L2-086 AC9).</summary>
    public static string ToIcs(DateOnly weekendOf, IEnumerable<IcsEvent> events)
    {
        var sb = new StringBuilder();
        sb.AppendLine("BEGIN:VCALENDAR");
        sb.AppendLine("VERSION:2.0");
        sb.AppendLine("PRODID:-//Saturdaze//Weekend Plan//EN");
        sb.AppendLine("CALSCALE:GREGORIAN");

        foreach (var block in events.OrderBy(b => b.Day).ThenBy(b => b.StartTime))
        {
            var date = block.Day == DayOfWeekend.Saturday ? weekendOf : weekendOf.AddDays(1);
            sb.AppendLine("BEGIN:VEVENT");
            sb.AppendLine($"UID:{block.Id}@saturdaze");
            sb.AppendLine($"DTSTAMP:{DateTimeOffset.UtcNow:yyyyMMddTHHmmssZ}");
            sb.AppendLine($"DTSTART:{FormatIcsDateTime(date, block.StartTime)}");
            sb.AppendLine($"DTEND:{FormatIcsDateTime(date, block.EndTime)}");
            sb.AppendLine($"SUMMARY:{EscapeIcs(block.Title)}");
            sb.AppendLine("END:VEVENT");
        }

        sb.AppendLine("END:VCALENDAR");
        return sb.ToString();
    }

    private static string FormatIcsDateTime(DateOnly date, TimeOnly time)
        => $"{date:yyyyMMdd}T{time:HHmmss}";

    private static string EscapeIcs(string value)
        => value.Replace("\\", "\\\\")
            .Replace(";", "\\;")
            .Replace(",", "\\,")
            .Replace("\r\n", "\\n")
            .Replace("\n", "\\n");
}
