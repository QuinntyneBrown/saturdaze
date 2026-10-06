using Saturdaze.Application.Photos;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>One photo as the Place photos screen shows it (L2-114): every column plus whether it would project.</summary>
public sealed record AdminPhotoDto(
    Guid Id,
    string Url,
    int Width,
    int Height,
    string Alt,
    string Attribution,
    string License,
    string Source,
    bool IsPrimary,
    string ReviewState,
    bool AdminLocked,
    DateTimeOffset? UpdatedAt,
    Guid? UpdatedBy,
    bool Blocked)
{
    public static AdminPhotoDto From(PlacePhoto photo, ImageOptions images) => new(
        photo.Id,
        photo.Url,
        photo.Width,
        photo.Height,
        photo.AltText,
        photo.Attribution,
        photo.License,
        photo.Source.ToString(),
        photo.IsPrimary,
        photo.ReviewState.ToString(),
        photo.AdminLocked,
        photo.UpdatedAt,
        photo.UpdatedBy,
        Blocked: !PlacePhotoReader.IsAllowed(photo.Url, images));
}

/// <summary>A place with every one of its photos and the number of weekend covers that follow it (L2-114).</summary>
public sealed record PlacePhotosDto(
    string Kind,
    Guid Id,
    string Name,
    int CoverImpact,
    IReadOnlyList<AdminPhotoDto> Photos);
