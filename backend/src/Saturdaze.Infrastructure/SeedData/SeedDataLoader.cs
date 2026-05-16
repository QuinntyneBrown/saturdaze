using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Infrastructure.SeedData;

public static class SeedDataLoader
{
    private const string ResourcePrefix = "Saturdaze.Infrastructure.SeedData.";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        await SeedActivitiesAsync(db, ct);
        await SeedRestaurantsAsync(db, ct);
        await SeedLocalEventsAsync(db, ct);
        await SeedFamilyAsync(db, ct);
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedActivitiesAsync(AppDbContext db, CancellationToken ct)
    {
        var items = await ReadAsync<List<ActivitySeed>>("activities.json", ct);
        var existing = await db.Activities.ToDictionaryAsync(a => a.Name, ct);
        foreach (var seed in items)
        {
            if (!existing.TryGetValue(seed.Name, out var entity))
            {
                entity = new Activity { Id = Guid.NewGuid(), Name = seed.Name };
                db.Activities.Add(entity);
            }
            entity.Category = seed.Category;
            entity.Indoor = seed.Indoor;
            entity.MinAge = seed.MinAge;
            entity.MaxAge = seed.MaxAge;
            entity.DriveMinutes = seed.DriveMinutes;
            entity.WeatherTags = seed.WeatherTags?.ToList() ?? new();
            entity.Description = seed.Description;
            entity.MapUrl = seed.MapUrl;
            entity.TypicalDurationMinutes = seed.TypicalDurationMinutes;
        }
    }

    private static async Task SeedRestaurantsAsync(AppDbContext db, CancellationToken ct)
    {
        var items = await ReadAsync<List<RestaurantSeed>>("restaurants.json", ct);
        var existing = await db.Restaurants.ToDictionaryAsync(r => new RestaurantKey(r.Name, r.Slot), ct);
        foreach (var seed in items)
        {
            var key = new RestaurantKey(seed.Name, seed.Slot);
            if (!existing.TryGetValue(key, out var entity))
            {
                entity = new Restaurant { Id = Guid.NewGuid(), Name = seed.Name, Slot = seed.Slot };
                db.Restaurants.Add(entity);
            }
            entity.Style = seed.Style;
            entity.WifeApproved = seed.WifeApproved;
            entity.Notes = seed.Notes ?? string.Empty;
            entity.DriveMinutes = seed.DriveMinutes;
        }
    }

    private static async Task SeedLocalEventsAsync(AppDbContext db, CancellationToken ct)
    {
        var items = await ReadAsync<List<LocalEventSeed>>("local-events.json", ct);
        var existing = await db.LocalEvents.ToDictionaryAsync(e => new LocalEventKey(e.Name, e.StartsOn), ct);
        foreach (var seed in items)
        {
            var key = new LocalEventKey(seed.Name, seed.StartsOn);
            if (!existing.TryGetValue(key, out var entity))
            {
                entity = new LocalEvent { Id = Guid.NewGuid(), Name = seed.Name, StartsOn = seed.StartsOn };
                db.LocalEvents.Add(entity);
            }
            entity.EndsOn = seed.EndsOn;
            entity.Location = seed.Location;
            entity.DriveMinutes = seed.DriveMinutes;
            entity.Url = seed.Url ?? string.Empty;
            entity.Category = seed.Category;
        }
    }

    private static async Task SeedFamilyAsync(AppDbContext db, CancellationToken ct)
    {
        var seed = await ReadAsync<FamilySeed>("family.json", ct);

        var family = await db.Families
            .Include(f => f.Members)
            .Include(f => f.Commitments)
            .Include(f => f.Preferences)
            .FirstOrDefaultAsync(f => f.HomeLocation == seed.HomeLocation, ct);

        if (family is null)
        {
            family = new Family { Id = Guid.NewGuid(), HomeLocation = seed.HomeLocation };
            db.Families.Add(family);
        }
        family.BudgetEnabled = seed.BudgetEnabled;

        foreach (var ms in seed.Members)
        {
            var member = family.Members.FirstOrDefault(m => m.Name == ms.Name);
            if (member is null)
            {
                family.Members.Add(new FamilyMember
                {
                    Id = Guid.NewGuid(),
                    FamilyId = family.Id,
                    Name = ms.Name,
                    Age = ms.Age
                });
            }
            else
            {
                member.Age = ms.Age;
            }
        }

        foreach (var cs in seed.Commitments)
        {
            var commitment = family.Commitments
                .FirstOrDefault(c => c.Title == cs.Title && c.DayOfWeek == cs.DayOfWeek);
            if (commitment is null)
            {
                family.Commitments.Add(new Commitment
                {
                    Id = Guid.NewGuid(),
                    FamilyId = family.Id,
                    Title = cs.Title,
                    DayOfWeek = cs.DayOfWeek,
                    StartTime = cs.StartTime,
                    EndTime = cs.EndTime
                });
            }
            else
            {
                commitment.StartTime = cs.StartTime;
                commitment.EndTime = cs.EndTime;
            }
        }

        foreach (var ps in seed.Preferences)
        {
            var pref = family.Preferences
                .FirstOrDefault(p => p.Kind == ps.Kind && p.Value == ps.Value);
            if (pref is null)
            {
                family.Preferences.Add(new Preference
                {
                    Id = Guid.NewGuid(),
                    FamilyId = family.Id,
                    Kind = ps.Kind,
                    Value = ps.Value
                });
            }
        }
    }

    private static async Task<T> ReadAsync<T>(string fileName, CancellationToken ct)
    {
        var resourceName = ResourcePrefix + fileName;
        var asm = typeof(SeedDataLoader).Assembly;
        await using var stream = asm.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Embedded seed resource '{resourceName}' not found.");
        var result = await JsonSerializer.DeserializeAsync<T>(stream, JsonOptions, ct);
        return result ?? throw new InvalidOperationException($"Seed resource '{resourceName}' was empty.");
    }

    private sealed record RestaurantKey(string Name, MealSlot Slot);
    private sealed record LocalEventKey(string Name, DateOnly StartsOn);

    private sealed record ActivitySeed(
        string Name, string Category, bool Indoor, int MinAge, int MaxAge,
        int DriveMinutes, List<string>? WeatherTags, int TypicalDurationMinutes,
        string Description, string MapUrl);

    private sealed record RestaurantSeed(
        string Name, string Style, MealSlot Slot, bool WifeApproved,
        int DriveMinutes, string? Notes);

    private sealed record LocalEventSeed(
        string Name, DateOnly StartsOn, DateOnly EndsOn, string Location,
        int DriveMinutes, string? Url, string Category);

    private sealed record FamilySeed(
        string HomeLocation, bool BudgetEnabled,
        List<MemberSeed> Members, List<CommitmentSeed> Commitments,
        List<PreferenceSeed> Preferences);

    private sealed record MemberSeed(string Name, int Age);
    private sealed record CommitmentSeed(string Title, DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);
    private sealed record PreferenceSeed(PreferenceKind Kind, string Value);
}
