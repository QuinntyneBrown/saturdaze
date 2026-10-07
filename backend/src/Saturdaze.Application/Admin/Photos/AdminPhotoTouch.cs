using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>What every administrator change stamps on a photo (L2-121): the lock, the time and who.</summary>
public static class AdminPhotoTouch
{
    public static void Apply(PlacePhoto photo, ICurrentUserAccessor user, IDateTimeProvider clock)
    {
        photo.AdminLocked = true;
        photo.ReviewState = PhotoReviewState.Reviewed;
        photo.UpdatedAt = clock.UtcNow;
        photo.UpdatedBy = user.UserId;
    }
}
