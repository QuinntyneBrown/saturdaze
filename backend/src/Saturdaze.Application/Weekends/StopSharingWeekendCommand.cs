using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Weekends;

/// <summary>Retires every share link to one of the family's weekends (L2-086 AC6).</summary>
public sealed record StopSharingWeekendCommand(Guid WeekendId) : IRequest;

public sealed class StopSharingWeekendCommandHandler : IRequestHandler<StopSharingWeekendCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IDateTimeProvider _clock;

    public StopSharingWeekendCommandHandler(IAppDbContext db, ICurrentFamilyAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task Handle(StopSharingWeekendCommand request, CancellationToken ct)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(ct);
        if (!await _db.Weekends.AnyAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, ct))
            throw new NotFoundException(nameof(Weekend), request.WeekendId);

        var now = _clock.UtcNow;
        foreach (var share in await _db.WeekendShares
            .Where(s => s.WeekendId == request.WeekendId && s.RevokedAtUtc == null)
            .ToListAsync(ct))
        {
            share.RevokedAtUtc = now;
        }
        await _db.SaveChangesAsync(ct);
    }
}
