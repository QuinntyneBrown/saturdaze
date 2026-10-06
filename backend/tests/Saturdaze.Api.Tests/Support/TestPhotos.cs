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
}
