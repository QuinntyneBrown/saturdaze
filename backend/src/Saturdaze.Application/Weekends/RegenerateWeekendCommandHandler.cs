using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Weekends;

public sealed class RegenerateWeekendCommandHandler : IRequestHandler<RegenerateWeekendCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly WeekendReplanner _replanner;

    public RegenerateWeekendCommandHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        WeekendReplanner replanner)
    {
        _db = db;
        _current = current;
        _replanner = replanner;
    }

    public async Task<WeekendDto> Handle(RegenerateWeekendCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);

        var ctx = await _replanner.RegenerateAsync(weekend, familyId, cancellationToken);
        return WeekendMapper.ToDto(weekend, ctx.Forecast);
    }
}
