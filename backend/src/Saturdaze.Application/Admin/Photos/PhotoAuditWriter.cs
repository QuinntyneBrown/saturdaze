using System.Text.Json;
using System.Text.Json.Serialization;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>
/// The one place that creates <see cref="PhotoAuditEntry"/> rows (L2-122): the administrator
/// from the current request, the UTC time, the place, the action and the values before and
/// after as JSON. The entry is added to the unit of work; the handler's save persists it.
/// </summary>
public sealed class PhotoAuditWriter
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;

    public PhotoAuditWriter(IAppDbContext db, ICurrentUserAccessor user, IDateTimeProvider clock)
    {
        _db = db;
        _user = user;
        _clock = clock;
    }

    public void Write(PlaceKind kind, Guid placeId, Guid photoId, PhotoAuditAction action, object? before, object? after)
    {
        _db.PhotoAuditEntries.Add(new PhotoAuditEntry
        {
            Id = Guid.NewGuid(),
            OccurredAt = _clock.UtcNow.ToUniversalTime(),
            AdminUserId = _user.UserId ?? throw new UnauthorizedAccessException("Photo changes need a signed-in administrator."),
            AdminEmail = _user.Email ?? string.Empty,
            PlaceKind = kind,
            PlaceId = placeId,
            PhotoId = photoId,
            Action = action,
            Before = before is null ? null : JsonSerializer.Serialize(before, Json),
            After = after is null ? null : JsonSerializer.Serialize(after, Json),
        });
    }

    /// <summary>The details every create records: the address and dimensions, never a file name (L2-122 AC3).</summary>
    public static object Snapshot(PlacePhoto photo) => new
    {
        url = photo.Url,
        width = photo.Width,
        height = photo.Height,
        alt = photo.AltText,
        attribution = photo.Attribution,
        licence = photo.License,
        primary = photo.IsPrimary,
    };
}
