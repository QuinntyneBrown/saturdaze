using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Photos;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

public sealed class AddPhotoFromUrlCommandHandler : IRequestHandler<AddPhotoFromUrlCommand, AdminPhotoDto>
{
    private readonly IAppDbContext _db;
    private readonly IRemoteImageFetcher _fetcher;
    private readonly IImageSanitizer _sanitizer;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;
    private readonly ImageOptions _images;
    private readonly PhotoAuditWriter _audit;

    public AddPhotoFromUrlCommandHandler(
        IAppDbContext db,
        IRemoteImageFetcher fetcher,
        IImageSanitizer sanitizer,
        ICurrentUserAccessor user,
        IDateTimeProvider clock,
        IOptions<ImageOptions> images,
        PhotoAuditWriter audit)
    {
        _audit = audit;
        _db = db;
        _fetcher = fetcher;
        _sanitizer = sanitizer;
        _user = user;
        _clock = clock;
        _images = images.Value;
    }

    public async Task<AdminPhotoDto> Handle(AddPhotoFromUrlCommand request, CancellationToken ct)
    {
        _ = await PlaceLookup.NameAsync(_db, request.Kind, request.PlaceId, ct)
            ?? throw new NotFoundException("Place", request.PlaceId);

        var url = request.Url!.Trim();
        // The same rule the family app projects photos through (L2-101 AC3), applied before any fetch.
        if (!PlacePhotoReader.IsAllowed(url, _images))
            throw new BadRequestException("url_not_allowed", "This address isn't on the image allow-list.");

        var siblings = await _db.PlacePhotos
            .Where(p => p.PlaceKind == request.Kind && p.PlaceId == request.PlaceId)
            .ToListAsync(ct);
        if (siblings.Any(p => string.Equals(p.Url, url, StringComparison.OrdinalIgnoreCase)))
            throw new ConflictException("photo_exists", "This place already has that photo.");

        var bytes = await _fetcher.FetchAsync(new Uri(url, UriKind.Absolute), ct)
            ?? throw new BadRequestException("unsupported_image", "That address did not return a JPEG, PNG or WebP image.");
        var image = _sanitizer.Sanitize(bytes)
            ?? throw new BadRequestException("unsupported_image", "That address did not return a JPEG, PNG or WebP image.");

        var photo = PlacePhoto.Create(
            request.Kind, request.PlaceId, url, image.Width, image.Height,
            request.Alt, request.Attribution, PhotoSource.Curated, request.Licence, primary: false)!;
        AdminPhotoTouch.Apply(photo, _user, _clock);

        var promote = PlacePhotoSet.ShouldPromoteCurated(siblings);
        _db.PlacePhotos.Add(photo);
        siblings.Add(photo);
        photo.IsPrimary = promote;
        _audit.Write(request.Kind, request.PlaceId, photo.Id, PhotoAuditAction.AddUrl, null, PhotoAuditWriter.Snapshot(photo));
        photo.IsPrimary = false;
        if (promote) await PrimaryPhotoWriter.MarkPrimaryAsync(_db, siblings, photo.Id, ct);
        else await _db.SaveChangesAsync(ct);

        return AdminPhotoDto.From(photo, _images);
    }
}
