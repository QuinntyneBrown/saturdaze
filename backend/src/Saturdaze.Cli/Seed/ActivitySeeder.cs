using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Domain.Entities;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Seed;

public sealed class ActivitySeeder : IJsonSeeder
{
    public string FileName => "activities.json";

    public async Task<int> SeedAsync(AppDbContext db, Stream json, CancellationToken ct)
    {
        var items = await JsonSerializer.DeserializeAsync<List<ActivityRecord>>(
            json, SeedJsonOptions.Default, ct) ?? new();
        if (items.Count == 0) return 0;

        var existing = await db.Activities.ToDictionaryAsync(a => a.Name, StringComparer.OrdinalIgnoreCase, ct);

        var written = 0;
        foreach (var seed in items)
        {
            if (string.IsNullOrWhiteSpace(seed.Name)) continue;

            if (!existing.TryGetValue(seed.Name, out var entity))
            {
                entity = new Activity { Id = Guid.NewGuid(), Name = seed.Name };
                db.Activities.Add(entity);
                existing[seed.Name] = entity;
            }

            entity.Category = seed.Category ?? string.Empty;
            entity.Indoor = seed.Indoor;
            entity.MinAge = seed.MinAge;
            entity.MaxAge = seed.MaxAge;
            entity.DriveMinutes = seed.DriveMinutes;
            entity.WeatherTags = seed.WeatherTags?.ToList() ?? new List<string>();
            entity.TypicalDurationMinutes = seed.TypicalDurationMinutes;
            entity.Description = seed.Description ?? string.Empty;
            entity.MapUrl = seed.MapUrl ?? string.Empty;
            written++;
        }

        return written;
    }

    private sealed record ActivityRecord(
        string Name,
        string? Category,
        bool Indoor,
        int MinAge,
        int MaxAge,
        int DriveMinutes,
        List<string>? WeatherTags,
        int TypicalDurationMinutes,
        string? Description,
        string? MapUrl);
}
