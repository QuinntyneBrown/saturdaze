namespace Saturdaze.Application.Email;

/// <summary>
/// <c>Saturdaze:Email</c>. With <see cref="SmtpHost"/> set, mail goes out over
/// SMTP; without it, each message is written as an <c>.eml</c> file to
/// <see cref="PickupDirectory"/> (Development and Testing).
/// </summary>
public sealed class EmailOptions
{
    public const string SectionName = "Saturdaze:Email";

    public string From { get; set; } = "Saturdaze <no-reply@saturdaze.ca>";

    /// <summary>Where links in mail point. Falls back to <c>Saturdaze:Share:AppOrigin</c>.</summary>
    public string? AppOrigin { get; set; }

    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; } = 587;
    public string? SmtpUsername { get; set; }
    public string? SmtpPassword { get; set; }
    public bool SmtpStartTls { get; set; } = true;

    public string PickupDirectory { get; set; } = "App_Data/mail";
}
