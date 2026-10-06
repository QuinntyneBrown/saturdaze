using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Photos;
using Saturdaze.Application.Weather;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Covers;

/// <summary>Use the default cover rule, or one of the weekend's stops' photos (L2-108 AC2).</summary>
public sealed record SetWeekendCoverCommand(Guid WeekendId, CoverSource Source, Guid? PlaceId) : IRequest<WeekendDto>;

public sealed class SetWeekendCoverCommandHandler : IRequestHandler<SetWeekendCoverCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly WeekendEnrichment _enrichment;
    private readonly WeekendForecastService _forecast;
    private readonly IPhotoStore _store;

    public SetWeekendCoverCommandHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        WeekendEnrichment enrichment,
        WeekendForecastService forecast,
        IPhotoStore store)
    {
        _db = db;
        _current = current;
        _enrichment = enrichment;
        _forecast = forecast;
        _store = store;
    }

    public async Task<WeekendDto> Handle(SetWeekendCoverCommand request, CancellationToken ct)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(ct);
        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, ct)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);

        var forecast = await _forecast.GetAsync(weekend.WeekendOf, ct);
        var previousUpload = weekend.CoverUploadKey;
        if (request.Source == CoverSource.Stop)
        {
            var projected = WeekendMapper.ToDto(weekend, forecast);
            var photos = await _enrichment.StopPhotosAsync(projected.Blocks, ct);
            if (request.PlaceId is not { } placeId || !photos.ContainsKey(placeId))
                throw new BadRequestException("cover_not_a_stop", "Pick a stop of this weekend that has a photo.");

            weekend.CoverSource = CoverSource.Stop;
            weekend.CoverUploadKey = null;
            weekend.CoverPlaceId = placeId;
            weekend.CoverPlaceKind = await KindOfAsync(placeId, ct);
        }
        else
        {
            weekend.CoverSource = CoverSource.Default;
            weekend.CoverUploadKey = null;
            weekend.CoverPlaceId = null;
            weekend.CoverPlaceKind = null;
        }

        await _db.SaveChangesAsync(ct);
        // A replaced family photo is deleted, not left behind in storage.
        if (previousUpload is not null) await _store.DeleteAsync(previousUpload, ct);
        return WeekendMapper.ToDto(weekend, forecast);
    }

    private async Task<PlaceKind> KindOfAsync(Guid placeId, CancellationToken ct) =>
        await _db.Activities.AnyAsync(a => a.Id == placeId, ct) ? PlaceKind.Activity
        : await _db.LocalEvents.AnyAsync(e => e.Id == placeId, ct) ? PlaceKind.LocalEvent
        : PlaceKind.Restaurant;
}
