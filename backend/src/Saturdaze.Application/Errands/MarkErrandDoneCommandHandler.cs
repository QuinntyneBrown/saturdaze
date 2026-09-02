using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Errands;

public sealed class MarkErrandDoneCommandHandler : IRequestHandler<MarkErrandDoneCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly WeekendForecastService _forecast;

    public MarkErrandDoneCommandHandler(IAppDbContext db, ICurrentFamilyAccessor current, WeekendForecastService forecast)
    {
        _db = db;
        _current = current;
        _forecast = forecast;
    }

    public async Task<WeekendDto> Handle(MarkErrandDoneCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(
                w => w.FamilyId == familyId && w.Errands.Any(e => e.Id == request.ErrandId),
                cancellationToken)
            ?? throw new NotFoundException(nameof(ShoppingErrand), request.ErrandId);

        var errand = weekend.Errands.Single(e => e.Id == request.ErrandId);
        errand.Done = request.Done;
        await _db.SaveChangesAsync(cancellationToken);

        var forecast = await _forecast.GetAsync(weekend.WeekendOf, cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
