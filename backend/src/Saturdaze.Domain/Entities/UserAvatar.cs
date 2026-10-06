namespace Saturdaze.Domain.Entities;

/// <summary>
/// Profile photo bytes for a <see cref="User"/>, kept apart from the user row
/// so ordinary user lookups never load image data (L2-087).
/// </summary>
public class UserAvatar
{
    public Guid UserId { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public byte[] Data { get; set; } = [];
    public DateTimeOffset UpdatedAtUtc { get; set; }
}
