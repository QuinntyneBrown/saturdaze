using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

public sealed class ReviewPhotoCommandHandler : IRequestHandler<ReviewPhotoCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;
    private readonly PhotoAuditWriter _audit;

    public ReviewPhotoCommandHandler(IAppDbContext db, ICurrentUserAccessor user, IDateTimeProvider clock, PhotoAuditWriter audit)
    {
        _audit = audit;
        _db = db;
        _user = user;
        _clock = clock;
    }

    public async Task Handle(ReviewPhotoCommand request, CancellationToken ct)
    {
        var photo = await _db.PlacePhotos.FirstOrDefaultAsync(p => p.Id == request.PhotoId, ct)
            ?? throw new NotFoundException(nameof(PlacePhoto), request.PhotoId);
        if (photo.ReviewState != PhotoReviewState.Unreviewed)
            throw new ConflictException("already_reviewed", "This photo has already been reviewed.");

        var siblings = await _db.PlacePhotos
            .Where(p => p.PlaceKind == photo.PlaceKind && p.PlaceId == photo.PlaceId)
            .ToListAsync(ct);

        var decision = request.Decision!.Trim().ToLowerInvariant();
        var reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();
        _audit.Write(photo.PlaceKind, photo.PlaceId, photo.Id, PhotoAuditAction.Review,
            new { url = photo.Url, reviewState = "Unreviewed", primary = photo.IsPrimary },
            new { decision, reason, reviewState = decision == ReviewPhotoCommand.Reject ? "Rejected" : "Reviewed" });
        switch (decision)
        {
            case ReviewPhotoCommand.Keep:
                AdminPhotoTouch.Apply(photo, _user, _clock);
                await _db.SaveChangesAsync(ct);
                break;
            case ReviewPhotoCommand.Primary:
                AdminPhotoTouch.Apply(photo, _user, _clock);
                await PrimaryPhotoWriter.MarkPrimaryAsync(_db, siblings, photo.Id, ct);
                break;
            case ReviewPhotoCommand.Reject:
                await RejectAsync(photo, siblings, request.Reason, ct);
                break;
        }
    }

    /// <summary>
    /// The row goes and its address is remembered for the place (L2-120 AC3, L2-121 AC1). When the
    /// rejected photo was primary, the place falls back to its default primary, if it has one.
    /// </summary>
    private async Task RejectAsync(PlacePhoto photo, List<PlacePhoto> siblings, string? reason, CancellationToken ct)
    {
        var trimmed = reason?.Trim();
        _db.RejectedPlacePhotos.Add(new RejectedPlacePhoto
        {
            Id = Guid.NewGuid(),
            PlaceKind = photo.PlaceKind,
            PlaceId = photo.PlaceId,
            Url = photo.Url,
            RejectedAt = _clock.UtcNow,
            RejectedBy = _user.UserId ?? throw new UnauthorizedAccessException("Reviewing a photo needs a signed-in administrator."),
            Reason = string.IsNullOrEmpty(trimmed) ? null : trimmed,
        });
        _db.PlacePhotos.Remove(photo);
        await _db.SaveChangesAsync(ct);

        if (!photo.IsPrimary) return;
        var rest = siblings.Where(s => s.Id != photo.Id).ToList();
        var next = PlacePhotoSet.DefaultPrimary(rest);
        if (next is not null) await PrimaryPhotoWriter.MarkPrimaryAsync(_db, rest, next.Id, ct);
    }
}
