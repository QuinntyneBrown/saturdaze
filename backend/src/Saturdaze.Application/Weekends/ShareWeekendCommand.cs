using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Weekends;

/// <summary>Mints a read-only share link for one of the family's weekends (L2-086).</summary>
public sealed record ShareWeekendCommand(Guid WeekendId) : IRequest<WeekendShareLink>;

/// <summary>The raw token, shown once; only its hash is stored.</summary>
public sealed record WeekendShareLink(string Token, DateTimeOffset ExpiresAtUtc);

public sealed class ShareWeekendCommandHandler : IRequestHandler<ShareWeekendCommand, WeekendShareLink>
{
    /// <summary>The share dialog says "expires in 7 days" (L2-086 AC5).</summary>
    public static readonly TimeSpan Lifetime = TimeSpan.FromDays(7);

    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IJwtTokenService _tokens;
    private readonly IDateTimeProvider _clock;

    public ShareWeekendCommandHandler(
        IAppDbContext db, ICurrentFamilyAccessor current, IJwtTokenService tokens, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _tokens = tokens;
        _clock = clock;
    }

    public async Task<WeekendShareLink> Handle(ShareWeekendCommand request, CancellationToken ct)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(ct);
        if (!await _db.Weekends.AnyAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, ct))
            throw new NotFoundException(nameof(Weekend), request.WeekendId);

        var now = _clock.UtcNow;
        var raw = _tokens.CreateRawRefreshToken();
        var share = new WeekendShare
        {
            Id = Guid.NewGuid(),
            WeekendId = request.WeekendId,
            TokenHash = _tokens.HashRefreshToken(raw),
            CreatedAtUtc = now,
            ExpiresAtUtc = now + Lifetime,
        };
        _db.WeekendShares.Add(share);
        await _db.SaveChangesAsync(ct);
        return new WeekendShareLink(raw, share.ExpiresAtUtc);
    }
}
