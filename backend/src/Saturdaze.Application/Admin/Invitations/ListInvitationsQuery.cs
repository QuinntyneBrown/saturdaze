using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;

namespace Saturdaze.Application.Admin.Invitations;

/// <summary>Every platform invitation, newest first (L2-158).</summary>
public sealed record ListInvitationsQuery : IRequest<IReadOnlyList<PlatformInvitationDto>>;

public sealed class ListInvitationsQueryHandler : IRequestHandler<ListInvitationsQuery, IReadOnlyList<PlatformInvitationDto>>
{
    private readonly IAppDbContext _db;
    private readonly PlatformInvitationMapper _mapper;

    public ListInvitationsQueryHandler(IAppDbContext db, PlatformInvitationMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<IReadOnlyList<PlatformInvitationDto>> Handle(ListInvitationsQuery request, CancellationToken ct)
    {
        var rows = await _db.PlatformInvitations.AsNoTracking()
            .OrderByDescending(i => i.CreatedAtUtc)
            .ThenByDescending(i => i.Id)
            .ToListAsync(ct);
        return await _mapper.ToDtosAsync(rows, null, ct);
    }
}
