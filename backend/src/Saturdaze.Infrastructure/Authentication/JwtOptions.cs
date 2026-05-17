namespace Saturdaze.Infrastructure.Authentication;

public class JwtOptions
{
    public const string SectionName = "Saturdaze:Jwt";

    public string Issuer { get; set; } = "saturdaze";
    public string Audience { get; set; } = "saturdaze-clients";
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 14;
}
