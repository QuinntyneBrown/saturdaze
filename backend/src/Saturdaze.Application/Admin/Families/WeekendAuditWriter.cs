using System.Text.Json;
using System.Text.Json.Serialization;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Families;

/// <summary>
/// The one place that creates <see cref="WeekendAuditEntry"/> rows (L2-161, ADR-019): the
/// administrator from the current request, the UTC time, the family and weekend, the action,
/// and the values before and after as JSON. The entry joins the unit of work; the admin
/// handler's save persists it after the family's handler has saved its change.
/// </summary>
public sealed class WeekendAuditWriter
{
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;

    public WeekendAuditWriter(IAppDbContext db, ICurrentUserAccessor user, IDateTimeProvider clock)
    {
        _db = db;
        _user = user;
        _clock = clock;
    }

    public void Write(
        Guid familyId, WeekendDto weekend, WeekendAuditAction action,
        DayOfWeekend? day = null, Guid? blockId = null, object? before = null, object? after = null)
    {
        _db.WeekendAuditEntries.Add(new WeekendAuditEntry
        {
            Id = Guid.NewGuid(),
            OccurredAt = _clock.UtcNow.ToUniversalTime(),
            AdminUserId = _user.UserId ?? throw new UnauthorizedAccessException("Weekend changes need a signed-in administrator."),
            AdminEmail = _user.Email ?? string.Empty,
            FamilyId = familyId,
            WeekendId = weekend.Id,
            WeekendOf = weekend.WeekendOf,
            Action = action,
            Day = day,
            BlockId = blockId,
            Before = before is null ? null : JsonSerializer.Serialize(before, Json),
            After = after is null ? null : JsonSerializer.Serialize(after, Json),
        });
    }

    /// <summary>What a block looks like for the log: its title and lock state.</summary>
    public static object Snapshot(ItineraryBlockDto block) => new { title = block.Title, locked = block.IsLocked };

    /// <summary>How many blocks a day, or the whole weekend, holds.</summary>
    public static object Count(WeekendDto weekend, DayOfWeekend? day = null)
        => new { blocks = weekend.Blocks.Count(b => day is null || b.Day == day) };
}
