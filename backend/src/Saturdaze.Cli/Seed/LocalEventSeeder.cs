using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Common;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Seed;

public sealed class LocalEventSeeder : IJsonSeeder
{
    private readonly IDateTimeProvider _clock;

    public LocalEventSeeder(IDateTimeProvider clock) => _clock = clock;

    public string FileName => "local-events.json";

    public async Task<int> SeedAsync(AppDbContext db, Stream json, CancellationToken ct)
    {
        var (anchor, items) = await ReadAsync(json, ct);
        if (items.Count == 0) return 0;

        var shiftDays = ResolveShiftDays(anchor);

        var existing = await db.LocalEvents.ToDictionaryAsync(
            e => new Key(e.Name, e.StartsOn), ct);

        var written = 0;
        foreach (var seed in items)
        {
            if (string.IsNullOrWhiteSpace(seed.Name)) continue;

            var startsOn = seed.StartsOn.AddDays(shiftDays);
            var endsOn = seed.EndsOn.AddDays(shiftDays);

            var key = new Key(seed.Name, startsOn);
            if (!existing.TryGetValue(key, out var entity))
            {
                entity = new LocalEvent
                {
                    Id = Guid.NewGuid(),
                    Name = seed.Name,
                    StartsOn = startsOn
                };
                db.LocalEvents.Add(entity);
                existing[key] = entity;
            }

            entity.EndsOn = endsOn;
            entity.Location = seed.Location ?? string.Empty;
            entity.DriveMinutes = seed.DriveMinutes;
            entity.Url = seed.Url ?? string.Empty;
            entity.Category = seed.Category ?? string.Empty;
            written++;
        }

        return written;
    }

    private int ResolveShiftDays(DateOnly? anchor)
    {
        if (anchor is null) return 0;
        var current = GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(_clock.Today);
        return current.DayNumber - anchor.Value.DayNumber;
    }

    private static async Task<(DateOnly? Anchor, IReadOnlyList<LocalEventRecord> Items)> ReadAsync(
        Stream json, CancellationToken ct)
    {
        using var doc = await JsonDocument.ParseAsync(json, cancellationToken: ct);
        if (doc.RootElement.ValueKind == JsonValueKind.Array)
        {
            var flat = doc.RootElement.Deserialize<List<LocalEventRecord>>(SeedJsonOptions.Default)
                       ?? new List<LocalEventRecord>();
            return (null, flat);
        }

        var envelope = doc.RootElement.Deserialize<EventEnvelope>(SeedJsonOptions.Default)
                       ?? new EventEnvelope(null, new());
        return (envelope.AnchorSaturday, envelope.Events ?? new());
    }

    private sealed record Key(string Name, DateOnly StartsOn);

    private sealed record EventEnvelope(DateOnly? AnchorSaturday, List<LocalEventRecord>? Events);

    private sealed record LocalEventRecord(
        string Name,
        DateOnly StartsOn,
        DateOnly EndsOn,
        string? Location,
        int DriveMinutes,
        string? Url,
        string? Category);
}
