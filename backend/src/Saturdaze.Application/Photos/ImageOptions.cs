namespace Saturdaze.Application.Photos;

/// <summary>Image delivery settings (L2-089), bound from <c>Saturdaze:Images</c>.</summary>
public sealed class ImageOptions
{
    public const string SectionName = "Saturdaze:Images";

    /// <summary>
    /// HTTPS origins photos may be served from: the app's own storage plus each configured
    /// provider (e.g. <c>https://images.example.com</c>). Anything else projects as no photo.
    /// Keep in step with the CSP <c>img-src</c> in <c>staticwebapp.config.json</c>.
    /// </summary>
    public List<string> AllowedOrigins { get; set; } = new();
}
