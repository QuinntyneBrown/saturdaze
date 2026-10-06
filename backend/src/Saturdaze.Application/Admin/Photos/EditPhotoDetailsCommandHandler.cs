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

public sealed class EditPhotoDetailsCommandHandler : IRequestHandler<EditPhotoDetailsCommand, AdminPhotoDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;
    private readonly ImageOptions _images;

    public EditPhotoDetailsCommandHandler(
        IAppDbContext db, ICurrentUserAccessor user, IDateTimeProvider clock, IOptions<ImageOptions> images)
    {
        _db = db;
        _user = user;
        _clock = clock;
        _images = images.Value;
    }

    public async Task<AdminPhotoDto> Handle(EditPhotoDetailsCommand request, CancellationToken ct)
    {
        var photo = await _db.PlacePhotos.FirstOrDefaultAsync(p => p.Id == request.PhotoId, ct)
            ?? throw new NotFoundException(nameof(PlacePhoto), request.PhotoId);

        photo.AltText = request.Alt?.Trim() ?? string.Empty;
        photo.Attribution = request.Attribution!.Trim();
        photo.License = request.Licence!.Trim();
        AdminPhotoTouch.Apply(photo, _user, _clock);
        await _db.SaveChangesAsync(ct);

        return AdminPhotoDto.From(photo, _images);
    }
}
