using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Admin.Families;

public sealed class ListAdminFamiliesQueryHandler : IRequestHandler<ListAdminFamiliesQuery, AdminFamilyPageDto>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;

    public ListAdminFamiliesQueryHandler(IAppDbContext db, IDateTimeProvider clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<AdminFamilyPageDto> Handle(ListAdminFamiliesQuery request, CancellationToken ct)
    {
        var upcoming = GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(_clock.Today);

        var families = await _db.Families.AsNoTracking()
            .Select(f => new
            {
                f.Id,
                f.Name,
                f.HomeLocation,
                f.OwnerUserId,
                MemberCount = f.Members.Count,
            })
            .ToListAsync(ct);

        var users = await _db.Users.AsNoTracking()
            .Where(u => u.FamilyId != null)
            .Select(u => new { u.Id, u.Email, FamilyId = u.FamilyId!.Value, u.CreatedAtUtc })
            .ToListAsync(ct);
        var usersByFamily = users.GroupBy(u => u.FamilyId).ToDictionary(g => g.Key, g => g.ToList());

        var weekends = await _db.Weekends.AsNoTracking()
            .Where(w => w.WeekendOf == upcoming)
            .Select(w => new
            {
                w.Id,
                w.FamilyId,
                w.WeekendOf,
                w.Title,
                w.RegenerateCount,
                BlockCount = w.Blocks.Count,
                LockedCount = w.Blocks.Count(b => b.IsLocked),
            })
            .ToListAsync(ct);
        var weekendByFamily = weekends.ToDictionary(w => w.FamilyId);

        var rows = families.Select(f =>
        {
            var accounts = usersByFamily.GetValueOrDefault(f.Id) ?? new();
            var owner = accounts.FirstOrDefault(u => u.Id == f.OwnerUserId);
            var emails = accounts
                .OrderBy(u => u.Id == f.OwnerUserId ? 0 : 1)
                .ThenBy(u => u.CreatedAtUtc)
                .Select(u => u.Email)
                .ToList();
            var weekend = weekendByFamily.GetValueOrDefault(f.Id);
            return new AdminFamilyDto(
                f.Id,
                DisplayName(f.Name, f.HomeLocation),
                f.HomeLocation,
                f.MemberCount,
                emails,
                owner?.Email,
                weekend is null
                    ? null
                    : new AdminWeekendSummaryDto(
                        weekend.Id, weekend.WeekendOf, weekend.Title, weekend.BlockCount, weekend.LockedCount, weekend.RegenerateCount));
        });

        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            var q = request.Q.Trim();
            rows = rows.Where(r =>
                r.Name.Contains(q, StringComparison.OrdinalIgnoreCase)
                || r.HomeLocation.Contains(q, StringComparison.OrdinalIgnoreCase)
                || r.Accounts.Any(a => a.Contains(q, StringComparison.OrdinalIgnoreCase)));
        }

        var all = rows.OrderBy(r => r.Name, StringComparer.OrdinalIgnoreCase).ThenBy(r => r.Id).ToList();
        var page = request.Page < 1 ? 1 : request.Page;
        var items = all.Skip((page - 1) * ListAdminFamiliesQuery.PageSize).Take(ListAdminFamiliesQuery.PageSize).ToList();
        return new AdminFamilyPageDto(items, all.Count, page, ListAdminFamiliesQuery.PageSize);
    }

    /// <summary>The family's name, else its home location, else "Unnamed family" (L2-157).</summary>
    public static string DisplayName(string? name, string homeLocation)
    {
        if (!string.IsNullOrWhiteSpace(name)) return name.Trim();
        if (!string.IsNullOrWhiteSpace(homeLocation)) return homeLocation.Trim();
        return "Unnamed family";
    }

    public static AdminFamilyDto ToDto(Family family, IReadOnlyList<User> accounts, AdminWeekendSummaryDto? upcoming)
    {
        var owner = accounts.FirstOrDefault(u => u.Id == family.OwnerUserId);
        var emails = accounts
            .OrderBy(u => u.Id == family.OwnerUserId ? 0 : 1)
            .ThenBy(u => u.CreatedAtUtc)
            .Select(u => u.Email)
            .ToList();
        return new AdminFamilyDto(
            family.Id, DisplayName(family.Name, family.HomeLocation), family.HomeLocation,
            family.Members.Count, emails, owner?.Email, upcoming);
    }
}
