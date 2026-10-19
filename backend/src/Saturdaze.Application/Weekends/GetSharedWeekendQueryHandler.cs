using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;

namespace Saturdaze.Application.Weekends;

public sealed class GetSharedWeekendQueryHandler : IRequestHandler<GetSharedWeekendQuery, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly WeekendForecastService _forecast;
    private readonly IJwtTokenService _tokens;
    private readonly IDateTimeProvider _clock;

    public GetSharedWeekendQueryHandler(
        IAppDbContext db, WeekendForecastService forecast, IJwtTokenService tokens, IDateTimeProvider clock)
    {
        _db = db;
        _forecast = forecast;
        _tokens = tokens;
        _clock = clock;
    }

    public async Task<WeekendDto> Handle(GetSharedWeekendQuery request, CancellationToken cancellationToken)
    {
        // An unknown, expired or retired link answers like a missing weekend (L2-086 AC3, AC5, AC6).
        var hash = _tokens.HashRefreshToken(request.Token ?? string.Empty);
        var now = _clock.UtcNow;
        var weekendId = await _db.WeekendShares.AsNoTracking()
            .Where(s => s.TokenHash == hash && s.RevokedAtUtc == null && s.ExpiresAtUtc > now)
            .Select(s => (Guid?)s.WeekendId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Share link is not valid.");

        var weekend = await _db.Weekends
            .AsNoTracking()
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.Id == weekendId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Weekend), weekendId);

        var forecast = await _forecast.GetAsync(weekend.WeekendOf, cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
