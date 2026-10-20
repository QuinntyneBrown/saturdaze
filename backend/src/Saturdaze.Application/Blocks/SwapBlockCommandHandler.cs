using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Blocks;

public sealed class SwapBlockCommandHandler : IRequestHandler<SwapBlockCommand, WeekendDto>
{
    public const string NoAlternativeReason = BlockSwapper.NoAlternativeReason;

    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly BlockSwapper _swapper;

    public SwapBlockCommandHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        BlockSwapper swapper)
    {
        _db = db;
        _current = current;
        _swapper = swapper;
    }

    public async Task<WeekendDto> Handle(SwapBlockCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(
                w => w.FamilyId == familyId && w.Blocks.Any(b => b.Id == request.BlockId),
                cancellationToken)
            ?? throw new NotFoundException(nameof(ItineraryBlock), request.BlockId);

        var target = weekend.Blocks.Single(b => b.Id == request.BlockId);
        var ctx = await _swapper.SwapAsync(weekend, target, familyId, request.RejectedActivityIds, cancellationToken);
        return WeekendMapper.ToDto(weekend, ctx.Forecast);
    }
}
