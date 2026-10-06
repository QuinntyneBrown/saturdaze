using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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

/// <summary>A family's own photo for the weekend's cover (L2-109). Never carries the file name.</summary>
public sealed record UploadWeekendCoverCommand(Guid WeekendId, byte[] Content) : IRequest<WeekendDto>;

public sealed class UploadWeekendCoverCommandHandler : IRequestHandler<UploadWeekendCoverCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IImageSanitizer _sanitizer;
    private readonly IPhotoStore _store;
    private readonly WeekendForecastService _forecast;
    private readonly ILogger<UploadWeekendCoverCommandHandler> _logger;

    public UploadWeekendCoverCommandHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        IImageSanitizer sanitizer,
        IPhotoStore store,
        WeekendForecastService forecast,
        ILogger<UploadWeekendCoverCommandHandler> logger)
    {
        _db = db;
        _current = current;
        _sanitizer = sanitizer;
        _store = store;
        _forecast = forecast;
        _logger = logger;
    }

    public async Task<WeekendDto> Handle(UploadWeekendCoverCommand request, CancellationToken ct)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(ct);
        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, ct)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);

        var image = _sanitizer.Sanitize(request.Content)
            ?? throw new BadRequestException("unsupported_image", "Upload a JPEG, PNG or WebP photo.");

        var key = await _store.PutAsync(image.Content, image.ContentType, ct);
        var previous = weekend.CoverUploadKey;
        weekend.CoverSource = CoverSource.Upload;
        weekend.CoverUploadKey = key;
        weekend.CoverUploadWidth = image.Width;
        weekend.CoverUploadHeight = image.Height;
        weekend.CoverPlaceId = null;
        weekend.CoverPlaceKind = null;
        await _db.SaveChangesAsync(ct);
        if (previous is not null) await _store.DeleteAsync(previous, ct);

        // L2-109 AC7: the weekend and the size only — never the file name or content.
        _logger.LogInformation("Cover uploaded for weekend {WeekendId} ({Bytes} bytes)", weekend.Id, image.Content.Length);

        var forecast = await _forecast.GetAsync(weekend.WeekendOf, ct);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
