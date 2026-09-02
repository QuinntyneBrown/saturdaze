using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;

namespace Saturdaze.Application.Weekends;

public sealed class GetSharedWeekendQueryHandler : IRequestHandler<GetSharedWeekendQuery, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly WeekendForecastService _forecast;

    public GetSharedWeekendQueryHandler(IAppDbContext db, WeekendForecastService forecast)
    {
        _db = db;
        _forecast = forecast;
    }

    public async Task<WeekendDto> Handle(GetSharedWeekendQuery request, CancellationToken cancellationToken)
    {
        var weekend = await _db.Weekends
            .AsNoTracking()
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Weekend), request.Id);

        var forecast = await _forecast.GetAsync(weekend.WeekendOf, cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
