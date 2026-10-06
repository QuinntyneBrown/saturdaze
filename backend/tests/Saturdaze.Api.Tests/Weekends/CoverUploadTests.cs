using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using SkiaSharp;
using Xunit;

namespace Saturdaze.Api.Tests.Weekends;

/// <summary>L2-097: family photo uploads are checked, cleaned, stored privately and served signed.</summary>
public class CoverUploadTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public CoverUploadTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = (_, _, from, to) =>
        {
            var days = new List<WeatherForecast>();
            for (var d = from; d <= to; d = d.AddDays(1))
                days.Add(new WeatherForecast(d, new[] { "sunny" }, 24, 16, 0.0, false));
            return days;
        };
    }

    private async Task<(HttpClient Client, Guid WeekendId)> PlanAsync()
    {
        var client = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        var res = await client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-16" });
        res.EnsureSuccessStatusCode();
        return (client, JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid());
    }

    private static MultipartFormDataContent Upload(byte[] bytes, string fileName, string contentType = "image/jpeg")
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        return new MultipartFormDataContent { { file, "file", fileName } };
    }

    /// <summary>A small JPEG carrying an EXIF block with a GPS latitude reference.</summary>
    private static byte[] JpegWithGps()
    {
        using var bitmap = new SKBitmap(64, 48);
        bitmap.Erase(new SKColor(120, 90, 200));
        using var data = bitmap.Encode(SKEncodedImageFormat.Jpeg, 90);
        var jpeg = data.ToArray();

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

    private static bool Contains(byte[] haystack, byte[] needle) =>
        Enumerable.Range(0, haystack.Length - needle.Length + 1).Any(i => haystack.AsSpan(i, needle.Length).SequenceEqual(needle));

    [Fact]
    public async Task An_uploaded_photo_becomes_the_cover_without_its_location_data()
    {
        // Traces to: L2-097 AC4
        var (client, id) = await PlanAsync();
        var original = JpegWithGps();
        Contains(original, "Exif"u8.ToArray()).Should().BeTrue("the fixture carries EXIF");

        var res = await client.PostAsync($"/api/weekends/{id}/cover", Upload(original, "holiday.jpg"));
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var cover = JsonDocument.Parse(body).RootElement.GetProperty("cover");
        cover.GetProperty("source").GetString().Should().Be("upload");
        cover.GetProperty("label").GetString().Should().Be("Your photo");

        var anonymous = _factory.CreateClient();
        var served = await anonymous.GetAsync(cover.GetProperty("url").GetString());
        served.StatusCode.Should().Be(HttpStatusCode.OK);
        var bytes = await served.Content.ReadAsByteArrayAsync();
        Contains(bytes, "Exif"u8.ToArray()).Should().BeFalse("all metadata is stripped");
        SKBitmap.Decode(bytes).Should().NotBeNull("the stored file is still an image");
    }

    [Fact]
    public async Task Another_familys_weekend_is_not_found()
    {
        // Traces to: L2-097 AC1
        var (_, id) = await PlanAsync();
        var stranger = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        var res = await stranger.PostAsync($"/api/weekends/{id}/cover", Upload(JpegWithGps(), "photo.jpg"));
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task A_file_that_is_not_an_image_is_refused_whatever_its_name()
    {
        // Traces to: L2-097 AC2
        var (client, id) = await PlanAsync();
        var pdf = Encoding.ASCII.GetBytes("%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF");
        var res = await client.PostAsync($"/api/weekends/{id}/cover", Upload(pdf, "photo.jpg"));
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        JsonDocument.Parse(body).RootElement.GetProperty("code").GetString().Should().Be("unsupported_image");
    }

    [Fact]
    public async Task A_file_over_ten_megabytes_is_refused_and_nothing_is_stored()
    {
        // Traces to: L2-097 AC3
        var (client, id) = await PlanAsync();
        var before = Directory.Exists(_factory.PhotoDirectory) ? Directory.GetFiles(_factory.PhotoDirectory).Length : 0;
        var big = JpegWithGps().Concat(new byte[11 * 1024 * 1024]).ToArray();

        var res = await client.PostAsync($"/api/weekends/{id}/cover", Upload(big, "big.jpg"));

        res.StatusCode.Should().Be(HttpStatusCode.RequestEntityTooLarge);
        var after = Directory.Exists(_factory.PhotoDirectory) ? Directory.GetFiles(_factory.PhotoDirectory).Length : 0;
        after.Should().Be(before);
        var weekend = JsonDocument.Parse(await client.GetStringAsync($"/api/weekends/{id}")).RootElement;
        if (weekend.GetProperty("cover").ValueKind == JsonValueKind.Object)
            weekend.GetProperty("cover").GetProperty("source").GetString().Should().NotBe("upload");
    }

    [Fact]
    public async Task A_signed_photo_url_stops_working_once_it_expires()
    {
        // Traces to: L2-097 AC5
        var (client, id) = await PlanAsync();
        var res = await client.PostAsync($"/api/weekends/{id}/cover", Upload(JpegWithGps(), "photo.jpg"));
        res.EnsureSuccessStatusCode();
        var url = JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement
            .GetProperty("cover").GetProperty("url").GetString()!;

        var anonymous = _factory.CreateClient();
        (await anonymous.GetAsync(url)).StatusCode.Should().Be(HttpStatusCode.OK);

        var today = _factory.Clock.Today;
        try
        {
            _factory.Clock.Today = today.AddDays(1);
            (await anonymous.GetAsync(url)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }
        finally
        {
            _factory.Clock.Today = today;
        }

        (await anonymous.GetAsync(url.Replace("sig=", "sig=x"))).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task A_share_link_holder_can_see_the_uploaded_cover()
    {
        // Traces to: L2-097 AC6
        var (client, id) = await PlanAsync();
        (await client.PostAsync($"/api/weekends/{id}/cover", Upload(JpegWithGps(), "photo.jpg"))).EnsureSuccessStatusCode();
        var share = await client.PostAsync($"/api/weekends/{id}/share", content: null);
        share.EnsureSuccessStatusCode();
        var token = JsonDocument.Parse(await share.Content.ReadAsStringAsync()).RootElement.GetProperty("token").GetString();

        var anonymous = _factory.CreateClient();
        var shared = JsonDocument.Parse(await anonymous.GetStringAsync($"/api/weekends/shared/{token}")).RootElement;
        var url = shared.GetProperty("cover").GetProperty("url").GetString();
        (await anonymous.GetAsync(url)).StatusCode.Should().Be(HttpStatusCode.OK);

        (await anonymous.GetAsync("/api/weekends/shared/not-a-token")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Uploads_log_the_weekend_and_size_but_never_the_file_name()
    {
        // Traces to: L2-097 AC7
        var (client, id) = await PlanAsync();
        const string fileName = "kids-at-grandmas-house-gps.jpg";
        (await client.PostAsync($"/api/weekends/{id}/cover", Upload(JpegWithGps(), fileName))).EnsureSuccessStatusCode();

        var messages = _factory.Logs.Messages;
        messages.Should().Contain(m => m.Contains(id.ToString()) && m.Contains("bytes"));
        messages.Should().NotContain(m => m.Contains(fileName));
    }
}
