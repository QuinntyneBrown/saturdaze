namespace Saturdaze.Domain.Entities;

/// <summary>
/// A read-only share link to a weekend (L2-086). Only the hash of its random
/// token is stored; the link works until it expires or sharing stops.
/// </summary>
public class WeekendShare
{
    public Guid Id { get; set; }
    public Guid WeekendId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }
}
