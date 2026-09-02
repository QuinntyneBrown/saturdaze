using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Weekends;

public sealed class LockWeekendDayCommandHandler : IRequestHandler<LockWeekendDayCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly WeekendForecastService _forecast;

    public LockWeekendDayCommandHandler(IAppDbContext db, ICurrentFamilyAccessor current, WeekendForecastService forecast)
    {
        _db = db;
        _current = current;
        _forecast = forecast;
    }

    public async Task<WeekendDto> Handle(LockWeekendDayCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);

        foreach (var block in weekend.Blocks.Where(b => b.Day == request.Day))
        {
            // Commitments stay locked whatever the day-level toggle says (L2-011).
            block.IsLocked = request.Locked || block.Kind == BlockKind.Commitment;
        }

        await _db.SaveChangesAsync(cancellationToken);

        var forecast = await _forecast.GetAsync(weekend.WeekendOf, cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
