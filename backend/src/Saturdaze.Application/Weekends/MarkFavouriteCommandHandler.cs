using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;

namespace Saturdaze.Application.Weekends;

public sealed class MarkFavouriteCommandHandler : IRequestHandler<MarkFavouriteCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly WeekendForecastService _forecast;

    public MarkFavouriteCommandHandler(IAppDbContext db, ICurrentFamilyAccessor current, WeekendForecastService forecast)
    {
        _db = db;
        _current = current;
        _forecast = forecast;
    }

    public async Task<WeekendDto> Handle(MarkFavouriteCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Weekend), request.WeekendId);

        weekend.IsFavourite = request.Favourite;
        await _db.SaveChangesAsync(cancellationToken);

        var forecast = await _forecast.GetAsync(weekend.WeekendOf, cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
