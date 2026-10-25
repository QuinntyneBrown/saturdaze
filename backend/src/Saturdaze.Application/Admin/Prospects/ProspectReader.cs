using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Covers;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Prospects;

/// <summary>Loads prospects with their family and weekend and projects them for Saturdaze Admin.</summary>
public sealed class ProspectReader
{
    private readonly IAppDbContext _db;
    private readonly WeekendForecastService _forecast;
    private readonly WeekendEnrichment _enrichment;

    public ProspectReader(IAppDbContext db, WeekendForecastService forecast, WeekendEnrichment enrichment)
    {
        _db = db;
        _forecast = forecast;
        _enrichment = enrichment;
    }

    /// <summary>The prospect and its tracked weekend with blocks and errands, or 404.</summary>
    public async Task<(Prospect Prospect, Weekend Weekend)> LoadWeekendAsync(Guid prospectId, CancellationToken ct)
    {
        var prospect = await _db.Prospects.FirstOrDefaultAsync(p => p.Id == prospectId, ct)
            ?? throw new NotFoundException(nameof(Prospect), prospectId);
        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleAsync(w => w.Id == prospect.WeekendId, ct);
        return (prospect, weekend);
    }

    public async Task<ProspectDto> ReadAsync(Guid prospectId, bool withWeekend, CancellationToken ct)
    {
        var prospect = await _db.Prospects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == prospectId, ct)
            ?? throw new NotFoundException(nameof(Prospect), prospectId);
        return (await ProjectAsync(new[] { prospect }, withWeekend, ct)).Single();
    }

    public async Task<IReadOnlyList<ProspectDto>> ProjectAsync(IReadOnlyList<Prospect> prospects, bool withWeekend, CancellationToken ct)
    {
        var familyIds = prospects.Select(p => p.FamilyId).ToList();
        var families = await _db.Families.AsNoTracking()
            .Include(f => f.Members)
            .Include(f => f.Preferences)
            .Where(f => familyIds.Contains(f.Id))
            .ToDictionaryAsync(f => f.Id, ct);

        var prospectIds = prospects.Select(p => p.Id).ToList();
        var invitationCounts = await _db.PlatformInvitations.AsNoTracking()
            .Where(i => i.ProspectId != null && prospectIds.Contains(i.ProspectId.Value))
            .GroupBy(i => i.ProspectId!.Value)
            .Select(g => new { ProspectId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.ProspectId, x => x.Count, ct);

        var weekendIds = prospects.Select(p => p.WeekendId).ToList();
        var weekendsQuery = _db.Weekends.AsNoTracking().Where(w => weekendIds.Contains(w.Id));
        if (withWeekend) weekendsQuery = weekendsQuery.Include(w => w.Blocks).Include(w => w.Errands);
        var weekends = await weekendsQuery.ToDictionaryAsync(w => w.Id, ct);

        var result = new List<ProspectDto>(prospects.Count);
        foreach (var prospect in prospects)
        {
            var family = families[prospect.FamilyId];
            var weekend = weekends[prospect.WeekendId];
            WeekendDto? dto = null;
            if (withWeekend)
            {
                var forecast = await _forecast.GetAsync(weekend.WeekendOf, weekend.Home, ct);
                dto = await _enrichment.EnrichAsync(WeekendMapper.ToDto(weekend, forecast), ct);
            }
            var count = invitationCounts.GetValueOrDefault(prospect.Id);
            result.Add(new ProspectDto(
                prospect.Id,
                family.Name ?? string.Empty,
                family.HomeLocation,
                family.Members.OrderByDescending(m => m.Age).ThenBy(m => m.Name).Select(m => new ProspectMemberDto(m.Name, m.Age)).ToList(),
                family.Preferences.Where(p => p.Kind == PreferenceKind.Like).Select(p => p.Value).ToList(),
                weekend.WeekendOf,
                weekend.Id,
                StatusOf(prospect, count),
                prospect.CreatedAtUtc,
                count,
                dto));
        }
        return result;
    }

    public static ProspectStatus StatusOf(Prospect prospect, int invitationCount)
    {
        if (prospect.ClaimedByUserId is not null) return ProspectStatus.Claimed;
        return invitationCount > 0 ? ProspectStatus.Invited : ProspectStatus.Draft;
    }

    /// <summary>The prospect's weekend after a write, projected like a family's weekend.</summary>
    public async Task<WeekendDto> ToWeekendDtoAsync(Weekend weekend, CancellationToken ct)
    {
        var forecast = await _forecast.GetAsync(weekend.WeekendOf, weekend.Home, ct);
        return await _enrichment.EnrichAsync(WeekendMapper.ToDto(weekend, forecast), ct);
    }
}
