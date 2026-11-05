using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Planning;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Weekends;

public sealed class RegenerateWeekendDayCommandHandler
    : IRequestHandler<RegenerateWeekendDayCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly WeekendReplanner _replanner;

    public RegenerateWeekendDayCommandHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        WeekendReplanner replanner)
    {
        _db = db;
        _current = current;
        _replanner = replanner;
    }

    public async Task<WeekendDto> Handle(RegenerateWeekendDayCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);

        weekend.RegenerateCount++;
        var seed = weekend.WeekendOf.DayNumber + weekend.RegenerateCount * 47 + (int)request.Day;
        var ctx = await _replanner.ReplanDayAsync(weekend, familyId, request.Day, seed, cancellationToken);
        return WeekendMapper.ToDto(weekend, ctx.Forecast);
    }
}
