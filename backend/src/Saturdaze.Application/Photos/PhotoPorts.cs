namespace Saturdaze.Application.Photos;

/// <summary>Private object storage for family-uploaded photos (L2-109).</summary>
public interface IPhotoStore
{
    /// <summary>Stores the bytes under a new random key and returns the key.</summary>
    Task<string> PutAsync(byte[] content, string contentType, CancellationToken ct);

    /// <summary>The stored photo, or null when the key is unknown.</summary>
    Task<StoredPhoto?> OpenAsync(string key, CancellationToken ct);

    Task DeleteAsync(string key, CancellationToken ct);
}

public sealed record StoredPhoto(Stream Content, string ContentType);

/// <summary>Short-lived, tamper-proof URLs for private photos (L2-109 AC5).</summary>
public interface IPhotoUrlSigner
{
    /// <summary>A URL valid for <paramref name="lifetime"/> from now.</summary>
    string SignedUrl(string key, TimeSpan lifetime);

    /// <summary>True when the signature matches and the URL has not expired.</summary>
    bool IsValid(string key, long expiresUnixSeconds, string signature);
}

/// <summary>A cleaned image: re-encoded, metadata stripped (L2-109 AC4).</summary>
public sealed record SanitizedImage(byte[] Content, int Width, int Height, string ContentType);

/// <summary>Checks an upload by its content and re-encodes it without metadata.</summary>
public interface IImageSanitizer
{
    /// <summary>The cleaned image, or null when the bytes are not a JPEG, PNG or WebP (AC2).</summary>
    SanitizedImage? Sanitize(byte[] content);
}

/// <summary>Upload and signed-URL settings, bound from <c>Saturdaze:Photos</c>.</summary>
public sealed class PhotoOptions
{
    public const string SectionName = "Saturdaze:Photos";

    /// <summary>The largest upload accepted (L2-109: 10 MB).</summary>
    public const long MaxUploadBytes = 10 * 1024 * 1024;

    /// <summary>Directory of the file-system store.</summary>
    public string Directory { get; set; } = "App_Data/photos";

    /// <summary>HMAC key for signed URLs; at least 32 bytes.</summary>
    public string SigningKey { get; set; } = string.Empty;

    /// <summary>How long a family's photo URL stays valid.</summary>
    public int FamilyUrlMinutes { get; set; } = 15;

    /// <summary>How long a share link's photo URL stays valid (link previews need days, L2-110 AC3).</summary>
    public int ShareUrlDays { get; set; } = 7;
}
