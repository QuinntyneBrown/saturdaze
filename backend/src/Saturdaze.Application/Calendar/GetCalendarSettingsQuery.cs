using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;

namespace Saturdaze.Application.Calendar;

/// <summary>The Calendar section's state for the caller (L2-165, L2-171).</summary>
public sealed record GetCalendarSettingsQuery : IRequest<CalendarSettingsDto>;

public sealed record CalendarSettingsDto(bool GoogleConfigured, CalendarFeedStatusDto Feed);

/// <summary>Whether the family has a link; the link itself is never shown again (L2-171).</summary>
public sealed record CalendarFeedStatusDto(bool Active, DateTimeOffset? CreatedUtc);

public sealed class GetCalendarSettingsQueryHandler : IRequestHandler<GetCalendarSettingsQuery, CalendarSettingsDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;

    public GetCalendarSettingsQueryHandler(IAppDbContext db, ICurrentFamilyAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<CalendarSettingsDto> Handle(GetCalendarSettingsQuery request, CancellationToken ct)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(ct);
        var feed = await _db.CalendarFeeds.AsNoTracking().FirstOrDefaultAsync(f => f.FamilyId == familyId, ct);
        return new CalendarSettingsDto(
            GoogleConfigured: false,
            new CalendarFeedStatusDto(feed is not null, feed?.CreatedUtc));
    }
}
