using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Auth;

public sealed record GetInvitationQuery(string Token) : IRequest<InvitationDto>;

public sealed class GetInvitationQueryHandler : IRequestHandler<GetInvitationQuery, InvitationDto>
{
    private readonly IAppDbContext _db;
    private readonly InvitationResolver _resolver;

    public GetInvitationQueryHandler(IAppDbContext db, InvitationResolver resolver)
    {
        _db = db;
        _resolver = resolver;
    }

    public async Task<InvitationDto> Handle(GetInvitationQuery request, CancellationToken ct)
    {
        var invitation = await _resolver.ResolveAsync(request.Token, ct);
        var familyName = await _db.Families.AsNoTracking()
            .Where(f => f.Id == invitation.FamilyId).Select(f => f.Name).FirstOrDefaultAsync(ct);
        var invitedBy = await _db.Users.AsNoTracking()
            .Where(u => u.Id == invitation.InvitedByUserId).Select(u => u.Email).FirstOrDefaultAsync(ct);
        return new InvitationDto(familyName, invitation.Email, invitedBy);
    }
}
