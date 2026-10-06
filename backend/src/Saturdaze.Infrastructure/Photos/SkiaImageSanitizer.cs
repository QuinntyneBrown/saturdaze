using Saturdaze.Application.Photos;
using SkiaSharp;

namespace Saturdaze.Infrastructure.Photos;

/// <summary>
/// Accepts JPEG, PNG and WebP by their magic bytes, whatever the file name says (L2-097 AC2),
/// then decodes, applies the camera orientation, caps the long edge and re-encodes as JPEG.
/// Re-encoding writes pixels only, so EXIF (GPS included), XMP and ICC metadata are gone (AC4).
/// </summary>
public sealed class SkiaImageSanitizer : IImageSanitizer
{
    public const int MaxEdge = 2400;
    public const int Quality = 85;

    public SanitizedImage? Sanitize(byte[] content)
    {
        if (!IsSupported(content)) return null;

        using var codec = SKCodec.Create(new MemoryStream(content));
        if (codec is null) return null;
        using var decoded = SKBitmap.Decode(codec);
        if (decoded is null) return null;

        using var oriented = Orient(decoded, codec.EncodedOrigin);
        using var sized = Fit(oriented);
        using var image = SKImage.FromBitmap(sized);
        using var data = image.Encode(SKEncodedImageFormat.Jpeg, Quality);
        return new SanitizedImage(data.ToArray(), sized.Width, sized.Height, "image/jpeg");
    }

    private static bool IsSupported(byte[] b) =>
        b.Length > 12 && (
            b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF                                     // JPEG
            || b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47                  // PNG
            || b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
               && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P');             // WebP

    private static SKBitmap Orient(SKBitmap source, SKEncodedOrigin origin)
    {
        var (width, height, rotate, flip) = origin switch
        {
            SKEncodedOrigin.RightTop => (source.Height, source.Width, 90, false),
            SKEncodedOrigin.BottomRight => (source.Width, source.Height, 180, false),
            SKEncodedOrigin.LeftBottom => (source.Height, source.Width, 270, false),
            SKEncodedOrigin.TopRight => (source.Width, source.Height, 0, true),
            _ => (source.Width, source.Height, 0, false),
        };

        var result = new SKBitmap(width, height);
        using var canvas = new SKCanvas(result);
        canvas.Translate(width / 2f, height / 2f);
        if (flip) canvas.Scale(-1, 1);
        canvas.RotateDegrees(rotate);
        canvas.Translate(-source.Width / 2f, -source.Height / 2f);
        using var image = SKImage.FromBitmap(source);
        canvas.DrawImage(image, 0, 0, new SKSamplingOptions(SKFilterMode.Linear));
        return result;
    }

    private static SKBitmap Fit(SKBitmap source)
    {
        var longest = Math.Max(source.Width, source.Height);
        if (longest <= MaxEdge) return source.Copy();
        var scale = (float)MaxEdge / longest;
        var info = new SKImageInfo((int)(source.Width * scale), (int)(source.Height * scale));
        return source.Resize(info, new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.Linear));
    }
}
