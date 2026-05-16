using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Domain.Entities;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Seed;

public sealed class LocalEventSeeder : IJsonSeeder
{
    public string FileName => "local-events.json";

    public async Task<int> SeedAsync(AppDbContext db, Stream json, CancellationToken ct)
    {
        var items = await JsonSerializer.DeserializeAsync<List<LocalEventRecord>>(
            json, SeedJsonOptions.Default, ct) ?? new();
        if (items.Count == 0) return 0;

        var existing = await db.LocalEvents.ToDictionaryAsync(
            e => new Key(e.Name, e.StartsOn), ct);

        var written = 0;
        foreach (var seed in items)
        {
            if (string.IsNullOrWhiteSpace(seed.Name)) continue;

            var key = new Key(seed.Name, seed.StartsOn);
            if (!existing.TryGetValue(key, out var entity))
            {
                entity = new LocalEvent
                {
                    Id = Guid.NewGuid(),
                    Name = seed.Name,
                    StartsOn = seed.StartsOn
                };
                db.LocalEvents.Add(entity);
                existing[key] = entity;
            }

            entity.EndsOn = seed.EndsOn;
            entity.Location = seed.Location ?? string.Empty;
            entity.DriveMinutes = seed.DriveMinutes;
            entity.Url = seed.Url ?? string.Empty;
            entity.Category = seed.Category ?? string.Empty;
            written++;
        }

        return written;
    }

    private sealed record Key(string Name, DateOnly StartsOn);

    private sealed record LocalEventRecord(
        string Name,
        DateOnly StartsOn,
        DateOnly EndsOn,
        string? Location,
        int DriveMinutes,
        string? Url,
        string? Category);
}
