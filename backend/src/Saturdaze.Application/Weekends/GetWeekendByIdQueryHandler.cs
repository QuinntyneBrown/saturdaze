using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;

namespace Saturdaze.Application.Weekends;

public sealed class GetWeekendByIdQueryHandler : IRequestHandler<GetWeekendByIdQuery, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly WeekendForecastService _forecast;

    public GetWeekendByIdQueryHandler(IAppDbContext db, ICurrentFamilyAccessor current, WeekendForecastService forecast)
    {
        _db = db;
        _current = current;
        _forecast = forecast;
    }

    public async Task<WeekendDto> Handle(GetWeekendByIdQuery request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        // Scoped to the caller's family: another family's id is a 404, never a leak.
        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.Id == request.Id && w.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Weekend), request.Id);

        var forecast = await _forecast.GetAsync(weekend.WeekendOf, cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
