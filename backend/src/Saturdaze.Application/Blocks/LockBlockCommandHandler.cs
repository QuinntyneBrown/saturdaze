using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Blocks;

public sealed class LockBlockCommandHandler : IRequestHandler<LockBlockCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly WeekendForecastService _forecast;

    public LockBlockCommandHandler(IAppDbContext db, ICurrentFamilyAccessor current, WeekendForecastService forecast)
    {
        _db = db;
        _current = current;
        _forecast = forecast;
    }

    public async Task<WeekendDto> Handle(LockBlockCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        // One query proves ownership and loads the aggregate we return.
        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(
                w => w.FamilyId == familyId && w.Blocks.Any(b => b.Id == request.BlockId),
                cancellationToken)
            ?? throw new NotFoundException(nameof(ItineraryBlock), request.BlockId);

        var block = weekend.Blocks.Single(b => b.Id == request.BlockId);
        if (block.Kind == BlockKind.Commitment && !request.Locked)
            throw new ConflictException("commitment_locked", "Recurring commitments are always locked; edit them on the profile.");

        block.IsLocked = request.Locked;
        await _db.SaveChangesAsync(cancellationToken);

        var forecast = await _forecast.GetAsync(weekend.WeekendOf, cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
