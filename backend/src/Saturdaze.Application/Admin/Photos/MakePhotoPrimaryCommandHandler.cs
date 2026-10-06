using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Photos;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Admin.Photos;

public sealed class MakePhotoPrimaryCommandHandler : IRequestHandler<MakePhotoPrimaryCommand, AdminPhotoDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;
    private readonly ImageOptions _images;

    public MakePhotoPrimaryCommandHandler(
        IAppDbContext db, ICurrentUserAccessor user, IDateTimeProvider clock, IOptions<ImageOptions> images)
    {
        _db = db;
        _user = user;
        _clock = clock;
        _images = images.Value;
    }

    public async Task<AdminPhotoDto> Handle(MakePhotoPrimaryCommand request, CancellationToken ct)
    {
        var photo = await _db.PlacePhotos.FirstOrDefaultAsync(p => p.Id == request.PhotoId, ct)
            ?? throw new NotFoundException(nameof(PlacePhoto), request.PhotoId);

        var siblings = await _db.PlacePhotos
            .Where(p => p.PlaceKind == photo.PlaceKind && p.PlaceId == photo.PlaceId)
            .ToListAsync(ct);

        AdminPhotoTouch.Apply(photo, _user, _clock);
        await PrimaryPhotoWriter.MarkPrimaryAsync(_db, siblings, photo.Id, ct);

        return AdminPhotoDto.From(photo, _images);
    }
}
