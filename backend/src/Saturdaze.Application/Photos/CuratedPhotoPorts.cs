namespace Saturdaze.Application.Photos;

/// <summary>
/// Public object storage for curated place photos (ADR-015): cacheable, served from an origin in
/// <see cref="ImageOptions.AllowedOrigins"/>, unlike the private <see cref="IPhotoStore"/>.
/// </summary>
public interface ICuratedPhotoStore
{
    /// <summary>Stores sanitized bytes under a new random key and returns the key.</summary>
    Task<string> PutAsync(byte[] content, string contentType, CancellationToken ct);

    /// <summary>The stored photo, or null when the key is unknown.</summary>
    Task<StoredPhoto?> OpenAsync(string key, CancellationToken ct);

    Task DeleteAsync(string key, CancellationToken ct);

    /// <summary>The permanent public URL families load the photo from; it is what <c>PlacePhoto.Url</c> stores.</summary>
    string PublicUrl(string key);
}

/// <summary>Curated store settings, bound from <c>Saturdaze:CuratedPhotos</c>.</summary>
public sealed class CuratedPhotoOptions
{
    public const string SectionName = "Saturdaze:CuratedPhotos";

    /// <summary>Directory of the file-system store.</summary>
    public string Directory { get; set; } = "App_Data/catalog-photos";

    /// <summary>
    /// The HTTPS origin <c>GET /api/catalog-photos/{key}</c> is reachable on. It is listed in
    /// <see cref="ImageOptions.AllowedOrigins"/> and both apps' CSP <c>img-src</c> (ADR-015).
    /// </summary>
    public string PublicOrigin { get; set; } = string.Empty;
}
