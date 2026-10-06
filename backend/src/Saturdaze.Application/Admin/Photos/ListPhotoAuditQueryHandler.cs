using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

public sealed class ListPhotoAuditQueryHandler : IRequestHandler<ListPhotoAuditQuery, PhotoAuditPageDto>
{
    private readonly IAppDbContext _db;

    public ListPhotoAuditQueryHandler(IAppDbContext db) => _db = db;

    public async Task<PhotoAuditPageDto> Handle(ListPhotoAuditQuery request, CancellationToken ct)
    {
        var entries = _db.PhotoAuditEntries.AsNoTracking();
        if (request.Kind is not null)
        {
            var kind = Enum.Parse<PlaceKind>(request.Kind, true);
            entries = entries.Where(e => e.PlaceKind == kind);
        }
        if (request.PlaceId is { } placeId) entries = entries.Where(e => e.PlaceId == placeId);
        if (request.AdminId is { } adminId) entries = entries.Where(e => e.AdminUserId == adminId);

        var total = await entries.CountAsync(ct);
        var page = await entries
            .OrderByDescending(e => e.OccurredAt).ThenByDescending(e => e.Sequence)
            .Skip((request.Page - 1) * ListPhotoAuditQuery.PageSize)
            .Take(ListPhotoAuditQuery.PageSize)
            .ToListAsync(ct);

        // The place name is looked up live; a place removed from the catalog still shows its id.
        var names = new Dictionary<(PlaceKind, Guid), string>();
        foreach (var entry in page)
        {
            var key = (entry.PlaceKind, entry.PlaceId);
            if (names.ContainsKey(key)) continue;
            names[key] = await PlaceLookup.NameAsync(_db, entry.PlaceKind, entry.PlaceId, ct) ?? "Removed place";
        }

        var items = page.Select(e => new PhotoAuditEntryDto(
            e.Id,
            e.OccurredAt,
            e.AdminUserId,
            e.AdminEmail,
            e.PlaceKind.ToString(),
            e.PlaceId,
            names[(e.PlaceKind, e.PlaceId)],
            e.PhotoId,
            ActionName(e.Action),
            e.Before,
            e.After)).ToList();
        return new PhotoAuditPageDto(items, total, request.Page, ListPhotoAuditQuery.PageSize);
    }

    /// <summary>The wire names the Activity log and its filters use: <c>upload</c>, <c>addUrl</c>, <c>edit</c>, <c>primary</c>, <c>remove</c>, <c>review</c>.</summary>
    public static string ActionName(PhotoAuditAction action) => action switch
    {
        PhotoAuditAction.AddUrl => "addUrl",
        _ => action.ToString().ToLowerInvariant(),
    };
}
