using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Seed;

public sealed class RestaurantSeeder : IJsonSeeder
{
    public string FileName => "restaurants.json";

    public async Task<int> SeedAsync(AppDbContext db, Stream json, CancellationToken ct)
    {
        var items = await JsonSerializer.DeserializeAsync<List<RestaurantRecord>>(
            json, SeedJsonOptions.Default, ct) ?? new();
        if (items.Count == 0) return 0;

        var existing = await db.Restaurants.ToDictionaryAsync(
            r => new Key(r.Name, r.Slot), ct);

        var written = 0;
        foreach (var seed in items)
        {
            if (string.IsNullOrWhiteSpace(seed.Name)) continue;

            var key = new Key(seed.Name, seed.Slot);
            if (!existing.TryGetValue(key, out var entity))
            {
                entity = new Restaurant
                {
                    Id = Guid.NewGuid(),
                    Name = seed.Name,
                    Slot = seed.Slot
                };
                db.Restaurants.Add(entity);
                existing[key] = entity;
            }

            entity.Style = seed.Style ?? string.Empty;
            entity.WifeApproved = seed.WifeApproved;
            entity.Notes = seed.Notes ?? string.Empty;
            entity.DriveMinutes = seed.DriveMinutes;
            written++;
        }

        return written;
    }

    private sealed record Key(string Name, MealSlot Slot);

    private sealed record RestaurantRecord(
        string Name,
        string? Style,
        MealSlot Slot,
        bool WifeApproved,
        int DriveMinutes,
        string? Notes);
}
