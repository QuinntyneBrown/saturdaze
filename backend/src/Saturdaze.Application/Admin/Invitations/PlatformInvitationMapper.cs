using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Admin.Invitations;

/// <summary>
/// Projects invitation rows for Saturdaze Admin: the derived status, the
/// inviting administrator's email and the attached sample weekend.
/// </summary>
public sealed class PlatformInvitationMapper
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;

    public PlatformInvitationMapper(IAppDbContext db, IDateTimeProvider clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<IReadOnlyList<PlatformInvitationDto>> ToDtosAsync(
        IReadOnlyList<PlatformInvitation> invitations,
        IReadOnlyDictionary<Guid, string>? urls,
        CancellationToken ct)
    {
        var now = _clock.UtcNow;
        var inviterIds = invitations.Select(i => i.InvitedByUserId).Distinct().ToList();
        var inviters = await _db.Users.AsNoTracking()
            .Where(u => inviterIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Email, ct);
        var samples = await SampleSummariesAsync(
            invitations.Where(i => i.ProspectId is not null).Select(i => i.ProspectId!.Value).Distinct().ToList(), ct);

        return invitations.Select(i => new PlatformInvitationDto(
            i.Id,
            i.Email,
            PlatformInvitationStatusRules.Of(i, now),
            i.ProspectId is { } pid ? samples.GetValueOrDefault(pid) : null,
            inviters.GetValueOrDefault(i.InvitedByUserId),
            i.Message,
            i.CreatedAtUtc,
            i.ExpiresAtUtc,
            i.AcceptedAtUtc,
            urls?.GetValueOrDefault(i.Id))).ToList();
    }

    private async Task<Dictionary<Guid, SampleWeekendSummaryDto>> SampleSummariesAsync(IReadOnlyList<Guid> prospectIds, CancellationToken ct)
    {
        if (prospectIds.Count == 0) return new Dictionary<Guid, SampleWeekendSummaryDto>();
        var rows = await _db.Prospects.AsNoTracking()
            .Where(p => prospectIds.Contains(p.Id))
            .Join(_db.Families.AsNoTracking(), p => p.FamilyId, f => f.Id, (p, f) => new { p.Id, p.WeekendId, f.Name })
            .Join(_db.Weekends.AsNoTracking(), x => x.WeekendId, w => w.Id, (x, w) => new { x.Id, x.Name, w.WeekendOf })
            .ToListAsync(ct);
        return rows.ToDictionary(r => r.Id, r => new SampleWeekendSummaryDto(r.Id, r.Name ?? string.Empty, r.WeekendOf));
    }
}
