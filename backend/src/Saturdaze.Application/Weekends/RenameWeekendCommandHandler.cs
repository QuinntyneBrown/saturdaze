using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Weekends;

public sealed class RenameWeekendCommandHandler : IRequestHandler<RenameWeekendCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly WeekendForecastService _forecast;

    public RenameWeekendCommandHandler(IAppDbContext db, ICurrentFamilyAccessor current, WeekendForecastService forecast)
    {
        _db = db;
        _current = current;
        _forecast = forecast;
    }

    public async Task<WeekendDto> Handle(RenameWeekendCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);

        weekend.Title = string.IsNullOrWhiteSpace(request.Title) ? null : request.Title.Trim();
        await _db.SaveChangesAsync(cancellationToken);

        var forecast = await _forecast.GetAsync(weekend.WeekendOf, cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
