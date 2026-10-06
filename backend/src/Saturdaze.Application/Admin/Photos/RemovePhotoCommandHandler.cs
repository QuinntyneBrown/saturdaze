using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Photos;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Admin.Photos;

public sealed class RemovePhotoCommandHandler : IRequestHandler<RemovePhotoCommand>
{
    public const string None = "none";

    private readonly IAppDbContext _db;
    private readonly ICuratedPhotoStore _store;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;

    public RemovePhotoCommandHandler(IAppDbContext db, ICuratedPhotoStore store, ICurrentUserAccessor user, IDateTimeProvider clock)
    {
        _db = db;
        _store = store;
        _user = user;
        _clock = clock;
    }

    public async Task Handle(RemovePhotoCommand request, CancellationToken ct)
    {
        var photo = await _db.PlacePhotos.FirstOrDefaultAsync(p => p.Id == request.PhotoId, ct)
            ?? throw new NotFoundException(nameof(PlacePhoto), request.PhotoId);

        var siblings = await _db.PlacePhotos
            .Where(p => p.PlaceKind == photo.PlaceKind && p.PlaceId == photo.PlaceId && p.Id != photo.Id)
            .ToListAsync(ct);

        PlacePhoto? next = null;
        if (photo.IsPrimary)
        {
            var choice = request.NextPrimaryId?.Trim();
            if (string.IsNullOrEmpty(choice))
                throw new BadRequestException("next_primary_required", "Choose the next primary photo, or no photo.");
            if (!string.Equals(choice, None, StringComparison.OrdinalIgnoreCase))
            {
                next = Guid.TryParse(choice, out var nextId) ? siblings.FirstOrDefault(s => s.Id == nextId) : null;
                if (next is null)
                    throw new BadRequestException("next_primary_invalid", "The next primary must be another photo of this place.");
            }
        }

        // The row goes first, so the one-primary index is free before the sibling takes over.
        _db.PlacePhotos.Remove(photo);
        await _db.SaveChangesAsync(ct);
        if (next is not null)
        {
            AdminPhotoTouch.Apply(next, _user, _clock);
            await PrimaryPhotoWriter.MarkPrimaryAsync(_db, siblings, next.Id, ct);
        }

        if (photo.StorageKey is { } key) await _store.DeleteAsync(key, ct);
    }
}
