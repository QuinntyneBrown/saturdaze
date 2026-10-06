namespace Saturdaze.Application.Admin.Photos;

/// <summary>One Activity log row (L2-122): who, when (UTC), the place, the action and the values before and after (JSON).</summary>
public sealed record PhotoAuditEntryDto(
    Guid Id,
    DateTimeOffset OccurredAt,
    Guid AdminId,
    string AdminEmail,
    string Kind,
    Guid PlaceId,
    string PlaceName,
    Guid PhotoId,
    string Action,
    string? Before,
    string? After);

public sealed record PhotoAuditPageDto(IReadOnlyList<PhotoAuditEntryDto> Items, int Total, int Page, int PageSize);

/// <summary>One photo an ingestion run left out, with the place linked when it still exists (L2-120 AC5).</summary>
public sealed record IngestionPhotoSkipDto(string PlaceName, string Url, string Reason, string? Kind, Guid? PlaceId);

/// <summary>One ingestion run's photo skips (L2-120 AC5).</summary>
public sealed record IngestionPhotoSkipsDto(
    Guid RunId,
    DateTimeOffset StartedUtc,
    string Type,
    string Status,
    IReadOnlyList<IngestionPhotoSkipDto> Skips);
