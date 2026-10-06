using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Avatars;

public class SetAvatarCommandHandler : IRequestHandler<SetAvatarCommand, UserDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public SetAvatarCommandHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<UserDto> Handle(SetAvatarCommand request, CancellationToken ct)
    {
        var id = _current.UserId ?? throw new InvalidCredentialsException();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new InvalidCredentialsException();

        // SetAvatarCommandValidator has already rejected unrecognised content.
        var contentType = AvatarImage.DetectContentType(request.Data)!;

        var now = _clock.UtcNow;
        var avatar = await _db.UserAvatars.FirstOrDefaultAsync(a => a.UserId == id, ct);
        if (avatar is null)
        {
            avatar = new UserAvatar { UserId = id };
            _db.UserAvatars.Add(avatar);
        }
        avatar.ContentType = contentType;
        avatar.Data = request.Data;
        avatar.UpdatedAtUtc = now;

        // A new token per upload retires the previous capability URL.
        user.AvatarToken = Guid.NewGuid();
        user.UpdatedAtUtc = now;
        await _db.SaveChangesAsync(ct);

        return UserDto.From(user);
    }
}
