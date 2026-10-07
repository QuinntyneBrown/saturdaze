using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Photos;

namespace Saturdaze.Application.Admin.Photos;

public sealed class GetPlacePhotosQueryHandler : IRequestHandler<GetPlacePhotosQuery, PlacePhotosDto>
{
    private readonly IAppDbContext _db;
    private readonly ImageOptions _images;

    public GetPlacePhotosQueryHandler(IAppDbContext db, IOptions<ImageOptions> images)
    {
        _db = db;
        _images = images.Value;
    }

    public async Task<PlacePhotosDto> Handle(GetPlacePhotosQuery request, CancellationToken ct)
    {
        var name = await PlaceLookup.NameAsync(_db, request.Kind, request.PlaceId, ct)
            ?? throw new NotFoundException("Place", request.PlaceId);

        var photos = await _db.PlacePhotos.AsNoTracking()
            .Where(p => p.PlaceKind == request.Kind && p.PlaceId == request.PlaceId)
            .ToListAsync(ct);

        var dtos = photos
            .OrderByDescending(p => p.IsPrimary)
            .ThenBy(p => p.Url, StringComparer.Ordinal)
            .Select(p => AdminPhotoDto.From(p, _images))
            .ToList();

        var coverImpact = await PlaceLookup.CoverImpactAsync(_db, request.Kind, request.PlaceId, ct);
        return new PlacePhotosDto(request.Kind.ToString(), request.PlaceId, name, coverImpact, dtos);
    }
}
