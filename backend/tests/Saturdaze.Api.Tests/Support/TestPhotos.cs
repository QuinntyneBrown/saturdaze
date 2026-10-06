using SkiaSharp;

namespace Saturdaze.Api.Tests.Support;

/// <summary>Real image bytes for upload tests.</summary>
public static class TestPhotos
{
    public static byte[] Jpeg(int width = 64, int height = 48)
    {
        using var bitmap = new SKBitmap(width, height);
        bitmap.Erase(new SKColor(120, 90, 200));
        using var data = bitmap.Encode(SKEncodedImageFormat.Jpeg, 90);
        return data.ToArray();
    }

    public static MultipartFormDataContent Upload(byte[] bytes, string fileName = "photo.jpg")
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
        return new MultipartFormDataContent { { file, "file", fileName } };
    }

    /// <summary>A small JPEG carrying an EXIF block with a GPS latitude reference.</summary>
    public static byte[] JpegWithGps()
    {
        var jpeg = Jpeg();

        var tiff = new List<byte>();
        tiff.AddRange("II*\0"u8.ToArray());
        tiff.AddRange(BitConverter.GetBytes(8));                 // IFD0 offset
        tiff.AddRange(BitConverter.GetBytes((ushort)1));          // one entry
        tiff.AddRange(BitConverter.GetBytes((ushort)0x8825));     // GPSInfo
        tiff.AddRange(BitConverter.GetBytes((ushort)4));          // LONG
        tiff.AddRange(BitConverter.GetBytes(1));
        tiff.AddRange(BitConverter.GetBytes(26));                // GPS IFD offset
        tiff.AddRange(BitConverter.GetBytes(0));                 // no next IFD
        tiff.AddRange(BitConverter.GetBytes((ushort)1));          // GPS IFD: one entry
        tiff.AddRange(BitConverter.GetBytes((ushort)0x0001));     // GPSLatitudeRef
        tiff.AddRange(BitConverter.GetBytes((ushort)2));          // ASCII
        tiff.AddRange(BitConverter.GetBytes(2));
        tiff.AddRange("N\0\0\0"u8.ToArray());
        tiff.AddRange(BitConverter.GetBytes(0));
        var payload = "Exif\0\0"u8.ToArray().Concat(tiff).ToArray();
        var length = payload.Length + 2;
        var app1 = new byte[] { 0xFF, 0xE1, (byte)(length >> 8), (byte)(length & 0xFF) }.Concat(payload);

        return jpeg.Take(2).Concat(app1).Concat(jpeg.Skip(2)).ToArray();
    }

    public static bool Contains(byte[] haystack, byte[] needle) =>
        Enumerable.Range(0, haystack.Length - needle.Length + 1).Any(i => haystack.AsSpan(i, needle.Length).SequenceEqual(needle));
}
