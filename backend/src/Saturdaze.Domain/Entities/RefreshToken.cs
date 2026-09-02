namespace Saturdaze.Domain.Entities;

public class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }
    public string? CreatedByIp { get; set; }

    /// <summary>
    /// Set when this token is rotated by <c>POST /api/auth/refresh</c>: the id
    /// of the token that replaced it (L2-033).
    /// </summary>
    public Guid? ReplacedByTokenId { get; set; }
}
