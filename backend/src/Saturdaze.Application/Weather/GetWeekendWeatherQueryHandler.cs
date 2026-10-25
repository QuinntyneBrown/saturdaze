using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Weather;

/// <summary>
/// The weekend forecast (L2-023). Anonymous callers get the configured home; a signed-in
/// family gets its own home (L2-190 AC4).
/// </summary>
public sealed class GetWeekendWeatherQueryHandler
    : IRequestHandler<GetWeekendWeatherQuery, IReadOnlyList<WeatherForecast>>
{
    private readonly WeekendForecastService _forecast;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IAppDbContext _db;

    public GetWeekendWeatherQueryHandler(WeekendForecastService forecast, ICurrentFamilyAccessor current, IAppDbContext db)
    {
        _forecast = forecast;
        _current = current;
        _db = db;
    }

    public async Task<IReadOnlyList<WeatherForecast>> Handle(GetWeekendWeatherQuery request, CancellationToken cancellationToken)
        => await _forecast.GetAsync(request.WeekendOf, await FamilyHomeAsync(cancellationToken), cancellationToken);

    private async Task<GeoLocation?> FamilyHomeAsync(CancellationToken ct)
    {
        Guid familyId;
        try
        {
            familyId = await _current.GetCurrentFamilyIdAsync(ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return null; // anonymous, or an account without a family yet
        }
        var family = await _db.Families.AsNoTracking().SingleOrDefaultAsync(f => f.Id == familyId, ct);
        return family?.HomeCoordinates?.Copy();
    }
}
