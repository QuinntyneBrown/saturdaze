using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Calendar;

/// <summary>The Calendar section's state for the caller (L2-165, L2-171).</summary>
public sealed record GetCalendarSettingsQuery : IRequest<CalendarSettingsDto>;

public sealed record CalendarSettingsDto(bool GoogleConfigured, GoogleCalendarConnectionDto? Google, CalendarFeedStatusDto Feed);

/// <summary>The caller's own connection; never the token (L2-173).</summary>
public sealed record GoogleCalendarConnectionDto(
    string Email, string Status, bool ReadCommitments, DateTimeOffset? LastSyncedUtc);

/// <summary>Whether the family has a link; the link itself is never shown again (L2-171).</summary>
public sealed record CalendarFeedStatusDto(bool Active, DateTimeOffset? CreatedUtc);

public sealed class GetCalendarSettingsQueryHandler : IRequestHandler<GetCalendarSettingsQuery, CalendarSettingsDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly ICurrentUserAccessor _user;
    private readonly IGoogleCalendarClient _google;

    public GetCalendarSettingsQueryHandler(
        IAppDbContext db, ICurrentFamilyAccessor current, ICurrentUserAccessor user, IGoogleCalendarClient google)
    {
        _db = db;
        _current = current;
        _user = user;
        _google = google;
    }

    public async Task<CalendarSettingsDto> Handle(GetCalendarSettingsQuery request, CancellationToken ct)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(ct);
        var feed = await _db.CalendarFeeds.AsNoTracking().FirstOrDefaultAsync(f => f.FamilyId == familyId, ct);
        var connection = await _db.CalendarConnections.AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == _user.UserId, ct);
        return new CalendarSettingsDto(
            _google.IsConfigured,
            connection is null ? null : new GoogleCalendarConnectionDto(
                connection.Email,
                connection.Status == CalendarConnectionStatus.Connected ? "connected" : "needs_reconnect",
                connection.ReadCommitments,
                connection.LastSyncedUtc),
            new CalendarFeedStatusDto(feed is not null, feed?.CreatedUtc));
    }
}
