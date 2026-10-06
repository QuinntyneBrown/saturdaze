using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Avatars;

public class GetAvatarQueryHandler : IRequestHandler<GetAvatarQuery, AvatarImageDto>
{
    private readonly IAppDbContext _db;

    public GetAvatarQueryHandler(IAppDbContext db) => _db = db;

    public async Task<AvatarImageDto> Handle(GetAvatarQuery request, CancellationToken ct)
    {
        var image = await (
                from user in _db.Users
                join avatar in _db.UserAvatars on user.Id equals avatar.UserId
                where user.AvatarToken == request.Token
                select new AvatarImageDto(avatar.Data, avatar.ContentType))
            .AsNoTracking()
            .FirstOrDefaultAsync(ct);

        return image ?? throw new NotFoundException("Avatar not found.");
    }
}
