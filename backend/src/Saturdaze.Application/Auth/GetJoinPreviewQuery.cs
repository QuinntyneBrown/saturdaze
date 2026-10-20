using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Covers;
using Saturdaze.Application.Weather;
using Saturdaze.Application.Weekends;

namespace Saturdaze.Application.Auth;

public sealed record GetJoinPreviewQuery(string Token) : IRequest<JoinPreviewDto>;

public sealed class GetJoinPreviewQueryHandler : IRequestHandler<GetJoinPreviewQuery, JoinPreviewDto>
{
    private readonly IAppDbContext _db;
    private readonly PlatformInvitationResolver _resolver;
    private readonly WeekendForecastService _forecast;
    private readonly WeekendEnrichment _enrichment;

    public GetJoinPreviewQueryHandler(
        IAppDbContext db, PlatformInvitationResolver resolver, WeekendForecastService forecast, WeekendEnrichment enrichment)
    {
        _db = db;
        _resolver = resolver;
        _forecast = forecast;
        _enrichment = enrichment;
    }

    public async Task<JoinPreviewDto> Handle(GetJoinPreviewQuery request, CancellationToken ct)
    {
        var invitation = await _resolver.ResolveAsync(request.Token, ct);
        var invitedBy = await _db.Users.AsNoTracking()
            .Where(u => u.Id == invitation.InvitedByUserId).Select(u => u.Email).FirstOrDefaultAsync(ct);
        if (invitation.ProspectId is not { } prospectId)
            return new JoinPreviewDto(invitation.Email, invitedBy, null, invitation.Message, null);

        // The sample is what a share-link viewer may see and nothing more (L2-086 AC7, L2-161 AC1).
        var prospect = await _db.Prospects.AsNoTracking().SingleAsync(p => p.Id == prospectId, ct);
        var familyName = await _db.Families.AsNoTracking()
            .Where(f => f.Id == prospect.FamilyId).Select(f => f.Name).FirstOrDefaultAsync(ct);
        var weekend = await _db.Weekends.AsNoTracking()
            .Include(w => w.Blocks).Include(w => w.Errands)
            .SingleAsync(w => w.Id == prospect.WeekendId, ct);
        var forecast = await _forecast.GetAsync(weekend.WeekendOf, ct);
        var dto = await _enrichment.EnrichAsync(WeekendMapper.ToDto(weekend, forecast), ct, shared: true);
        return new JoinPreviewDto(invitation.Email, invitedBy, familyName, invitation.Message, SharedWeekendDto.From(dto));
    }
}
