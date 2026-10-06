using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Photos;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

public sealed class UploadCuratedPhotoCommandHandler : IRequestHandler<UploadCuratedPhotoCommand, AdminPhotoDto>
{
    private readonly IAppDbContext _db;
    private readonly IImageSanitizer _sanitizer;
    private readonly ICuratedPhotoStore _store;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;
    private readonly ImageOptions _images;
    private readonly ILogger<UploadCuratedPhotoCommandHandler> _logger;

    public UploadCuratedPhotoCommandHandler(
        IAppDbContext db,
        IImageSanitizer sanitizer,
        ICuratedPhotoStore store,
        ICurrentUserAccessor user,
        IDateTimeProvider clock,
        IOptions<ImageOptions> images,
        ILogger<UploadCuratedPhotoCommandHandler> logger)
    {
        _db = db;
        _sanitizer = sanitizer;
        _store = store;
        _user = user;
        _clock = clock;
        _images = images.Value;
        _logger = logger;
    }

    public async Task<AdminPhotoDto> Handle(UploadCuratedPhotoCommand request, CancellationToken ct)
    {
        _ = await PlaceLookup.NameAsync(_db, request.Kind, request.PlaceId, ct)
            ?? throw new NotFoundException("Place", request.PlaceId);

        var image = _sanitizer.Sanitize(request.Content)
            ?? throw new BadRequestException("unsupported_image", "Upload a JPEG, PNG or WebP photo.");

        var key = await _store.PutAsync(image.Content, image.ContentType, ct);
        var photo = PlacePhoto.Create(
            request.Kind, request.PlaceId, _store.PublicUrl(key), image.Width, image.Height,
            request.Alt, request.Attribution, PhotoSource.Curated, request.Licence, primary: false)!;
        photo.StorageKey = key;
        AdminPhotoTouch.Apply(photo, _user, _clock);

        var siblings = await _db.PlacePhotos
            .Where(p => p.PlaceKind == request.Kind && p.PlaceId == request.PlaceId)
            .ToListAsync(ct);
        var promote = PlacePhotoSet.ShouldPromoteCurated(siblings);
        _db.PlacePhotos.Add(photo);
        siblings.Add(photo);
        if (promote) await PrimaryPhotoWriter.MarkPrimaryAsync(_db, siblings, photo.Id, ct);
        else await _db.SaveChangesAsync(ct);

        // L2-115 AC7: the place and the size only, never the file name or content.
        _logger.LogInformation("Curated photo uploaded for {PlaceKind} {PlaceId} ({Bytes} bytes)",
            request.Kind, request.PlaceId, image.Content.Length);

        return AdminPhotoDto.From(photo, _images);
    }
}
