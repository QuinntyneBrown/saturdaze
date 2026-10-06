using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>One catalog place as the Places screen lists it (L2-113).</summary>
public sealed record AdminPlaceDto(
    string Kind,
    Guid Id,
    string Name,
    int PhotoCount,
    PlacePhotoDto? Photo,
    IReadOnlyList<string> Flags,
    DateTimeOffset? UpdatedAt);

/// <summary>A page of <see cref="AdminPlaceDto"/>.</summary>
public sealed record AdminPlacePageDto(IReadOnlyList<AdminPlaceDto> Items, int Total, int Page, int PageSize);
