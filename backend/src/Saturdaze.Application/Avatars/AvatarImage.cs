namespace Saturdaze.Application.Avatars;

/// <summary>
/// Profile-photo content rules (L2-087): JPEG, PNG or WebP identified by the
/// file signature, never by the declared content type.
/// </summary>
public static class AvatarImage
{
    public const int MaxBytes = 2 * 1024 * 1024;

    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    private static readonly byte[] Riff = "RIFF"u8.ToArray();
    private static readonly byte[] Webp = "WEBP"u8.ToArray();

    /// <summary>The image content type for a recognised signature, otherwise null.</summary>
    public static string? DetectContentType(ReadOnlySpan<byte> data)
    {
        if (data.StartsWith(Jpeg)) return "image/jpeg";
        if (data.StartsWith(Png)) return "image/png";
        if (data.Length >= 12 && data.StartsWith(Riff) && data[8..12].SequenceEqual(Webp)) return "image/webp";
        return null;
    }
}
