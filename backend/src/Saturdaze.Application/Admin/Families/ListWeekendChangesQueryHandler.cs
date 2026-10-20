using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Families;

public sealed class ListWeekendChangesQueryHandler : IRequestHandler<ListWeekendChangesQuery, WeekendChangePageDto>
{
    private readonly IAppDbContext _db;
    private readonly AdminFamilyScope _scope;

    public ListWeekendChangesQueryHandler(IAppDbContext db, AdminFamilyScope scope)
    {
        _db = db;
        _scope = scope;
    }

    public async Task<WeekendChangePageDto> Handle(ListWeekendChangesQuery request, CancellationToken ct)
    {
        await _scope.EnterAsync(request.FamilyId, ct);
        var page = request.Page < 1 ? 1 : request.Page;
        var query = _db.WeekendAuditEntries.AsNoTracking().Where(e => e.FamilyId == request.FamilyId);
        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(e => e.Sequence)
            .Skip((page - 1) * ListWeekendChangesQuery.PageSize)
            .Take(ListWeekendChangesQuery.PageSize)
            .ToListAsync(ct);
        return new WeekendChangePageDto(items.Select(ToDto).ToList(), total, page, ListWeekendChangesQuery.PageSize);
    }

    public static WeekendChangeDto ToDto(WeekendAuditEntry e) => new(
        e.Id, e.OccurredAt, e.AdminUserId, e.AdminEmail, e.WeekendId, e.WeekendOf,
        ActionName(e.Action), e.Day?.ToString(), e.BlockId, e.Before, e.After, Summary(e));

    /// <summary>The action as the API spells it: camel case of the enum name.</summary>
    public static string ActionName(WeekendAuditAction action)
    {
        var name = action.ToString();
        return char.ToLowerInvariant(name[0]) + name[1..];
    }

    /// <summary>The one line the Changes section shows (L2-161 AC4).</summary>
    public static string Summary(WeekendAuditEntry e)
    {
        var before = Parse(e.Before);
        var after = Parse(e.After);
        string Title(JsonElement? v) => v is { } el && el.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "";
        string Blocks(JsonElement? v) => v is { } el && el.TryGetProperty("blocks", out var b) ? b.GetInt32().ToString() : "?";
        var day = e.Day?.ToString();
        return e.Action switch
        {
            WeekendAuditAction.Plan => $"Planned the weekend · {Blocks(after)} blocks",
            WeekendAuditAction.Regenerate => $"Regenerated the weekend · {Blocks(before)} → {Blocks(after)} blocks",
            WeekendAuditAction.RegenerateDay => $"{day} · Regenerated · {Blocks(before)} → {Blocks(after)} blocks",
            WeekendAuditAction.LockDay => $"Locked {day}",
            WeekendAuditAction.UnlockDay => $"Unlocked {day}",
            WeekendAuditAction.LockBlock => $"{day} · Locked {Title(after)}",
            WeekendAuditAction.UnlockBlock => $"{day} · Unlocked {Title(after)}",
            WeekendAuditAction.Swap => $"{day} · {Title(before)} → {Title(after)}",
            _ => e.Action.ToString(),
        };
    }

    private static JsonElement? Parse(string? json)
    {
        if (string.IsNullOrEmpty(json)) return null;
        try { return JsonDocument.Parse(json).RootElement; }
        catch (JsonException) { return null; }
    }
}
