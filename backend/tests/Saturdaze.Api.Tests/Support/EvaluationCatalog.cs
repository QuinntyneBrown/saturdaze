using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Travel;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.ValueObjects;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Api.Tests.Support;

/// <summary>
/// The supplementary catalog of docs/schedule-generation-evaluation.md: real venues and the
/// dated events of the Oct 31 and Nov 7 weekends, with approximate coordinates.
/// </summary>
internal static class EvaluationCatalog
{
    private static GeoLocation At(decimal lat, decimal lng, string address) =>
        new() { Latitude = lat, Longitude = lng, Address = address };

    /// <summary>The catalog's home the tests configure (Port Credit): stored drives are measured from it (L2-190).</summary>
    private static readonly GeoLocation CatalogHome = new() { Latitude = 43.5547m, Longitude = -79.5816m };

    private static int StoredDrive(decimal lat, decimal lng) =>
        TravelEstimator.Minutes(TravelEstimator.DistanceKm(CatalogHome, At(lat, lng, string.Empty)));

    private static Activity Place(string name, string category, bool indoor, int minutes, decimal lat, decimal lng,
        TimeOnly? opens = null, TimeOnly? closes = null, int minAge = 0, int maxAge = 99, string description = "") => new()
    {
        Id = Guid.NewGuid(), Name = name, Category = category, Indoor = indoor, MinAge = minAge, MaxAge = maxAge,
        DriveMinutes = StoredDrive(lat, lng), TypicalDurationMinutes = minutes, Description = description, MapUrl = $"https://maps.example.com/{Slug(name)}",
        OpensAt = opens, ClosesAt = closes, SourceUrl = $"https://{Slug(name)}.example.com", Geo = At(lat, lng, name),
    };

    private static LocalEvent Event(string name, string category, DateOnly from, DateOnly to, TimeOnly start, TimeOnly end,
        bool indoor, decimal lat, decimal lng, params string[] themes) => new()
    {
        Id = Guid.NewGuid(), Name = name, Category = category, StartsOn = from, EndsOn = to, StartTime = start, EndTime = end,
        Indoor = indoor, Location = name, DriveMinutes = StoredDrive(lat, lng), Url = $"https://{Slug(name)}.example.com", Geo = At(lat, lng, name),
        Themes = themes.ToList(),
    };

    private static string Slug(string name) =>
        new string(name.ToLowerInvariant().Where(c => char.IsLetterOrDigit(c) || c == ' ').ToArray()).Replace(' ', '-');

    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Activities.AnyAsync(a => a.Name == "Playdium")) return;

        db.Activities.AddRange(
            Place("Kariya Park", "Park", false, 90, 43.5879m, -79.6393m),
            Place("Rattray Marsh", "Nature", false, 90, 43.5094m, -79.6237m),
            Place("Playdium", "Arcade", true, 150, 43.5978m, -79.6545m, new TimeOnly(11, 0), new TimeOnly(21, 0), minAge: 4),
            Place("Funday!", "Indoor playground", true, 120, 43.6085m, -79.6888m, new TimeOnly(10, 0), new TimeOnly(20, 0), maxAge: 12),
            Place("Bradley Museum", "Heritage museum", true, 90, 43.5185m, -79.6156m, new TimeOnly(13, 0), new TimeOnly(16, 30)),
            Place("PAMA", "Art museum", true, 90, 43.6847m, -79.7600m, new TimeOnly(10, 0), new TimeOnly(16, 0)),
            Place("Kelso Conservation Area", "Conservation", false, 180, 43.5051m, -79.9470m),
            Place("Niagara Falls", "Landmark", false, 240, 43.0896m, -79.0849m),
            Place("Great Wolf Lodge", "Water park", true, 300, 43.0970m, -79.1180m));

        var oct31 = new DateOnly(2026, 10, 31);
        var nov1 = new DateOnly(2026, 11, 1);
        db.LocalEvents.AddRange(
            Event("Halloween in the Village", "Festival", oct31, oct31, new TimeOnly(11, 0), new TimeOnly(16, 0), false, 43.5517m, -79.5856m),
            Event("Happily Ever Haunts", "Theatre", oct31, nov1, new TimeOnly(13, 0), new TimeOnly(15, 0), true, 43.5897m, -79.6440m),
            Event("Nights of Lights & Pumpkinville", "Seasonal", new DateOnly(2026, 10, 1), new DateOnly(2026, 11, 2), new TimeOnly(18, 0), new TimeOnly(22, 0), false, 43.6312m, -79.6900m),
            Event("Park your Pumpkin", "Community", nov1, nov1, new TimeOnly(18, 0), new TimeOnly(20, 0), false, 43.5530m, -79.5830m),
            Event("TSO Symphony Spooktacular", "Music", oct31, oct31, new TimeOnly(14, 0), new TimeOnly(15, 30), true, 43.6466m, -79.3863m),
            Event("Día de los Muertos Drag Brunch", "Brunch", nov1, nov1, new TimeOnly(11, 0), new TimeOnly(14, 0), true, 43.6520m, -79.4080m),
            Event("Sunday Antique Market", "Market", nov1, nov1, new TimeOnly(10, 0), new TimeOnly(15, 0), true, 43.6200m, -79.5200m),
            Event("Sunday Antique Market", "Market", new DateOnly(2026, 11, 8), new DateOnly(2026, 11, 8), new TimeOnly(10, 0), new TimeOnly(15, 0), true, 43.6201m, -79.5201m),
            Event("Harry Potter: Visions of Magic", "Exhibition", new DateOnly(2026, 10, 1), new DateOnly(2027, 1, 15), new TimeOnly(10, 0), new TimeOnly(20, 0), true, 43.6400m, -79.4200m),
            Event("Royal Agricultural Winter Fair", "Fair", new DateOnly(2026, 11, 6), new DateOnly(2026, 11, 15), new TimeOnly(9, 0), new TimeOnly(21, 0), true, 43.6330m, -79.4180m));
        await db.SaveChangesAsync();
    }
}
