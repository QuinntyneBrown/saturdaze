using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Avatars;

public class RemoveAvatarCommandHandler : IRequestHandler<RemoveAvatarCommand, UserDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public RemoveAvatarCommandHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<UserDto> Handle(RemoveAvatarCommand request, CancellationToken ct)
    {
        var id = _current.UserId ?? throw new InvalidCredentialsException();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new InvalidCredentialsException();

        var avatar = await _db.UserAvatars.FirstOrDefaultAsync(a => a.UserId == id, ct);
        if (avatar is not null) _db.UserAvatars.Remove(avatar);
        if (avatar is not null || user.AvatarToken is not null)
        {
            user.AvatarToken = null;
            user.UpdatedAtUtc = _clock.UtcNow;
            await _db.SaveChangesAsync(ct);
        }

        return UserDto.From(user);
    }
}
