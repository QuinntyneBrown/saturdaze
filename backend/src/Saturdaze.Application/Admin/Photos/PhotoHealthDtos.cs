namespace Saturdaze.Application.Admin.Photos;

/// <summary>
/// One catalog's photo coverage (L2-112): how many places it has, how many have a primary
/// photo that projects for families, and how many carry each health flag.
/// </summary>
public sealed record CatalogPhotoHealthDto(
    string Catalog,
    string Kind,
    int Places,
    int WithPrimary,
    int NoPhoto,
    int BlockedUrl,
    int Unreviewed,
    int MissingAlt);

/// <summary>The Photo health screen's figures (L2-112), plus how many provider photos wait for review.</summary>
public sealed record PhotoHealthDto(IReadOnlyList<CatalogPhotoHealthDto> Catalogs, int PendingReviews);
