using System.Text.Json;

namespace Saturdaze.Api.Tests.Support;

/// <summary>
/// The canonical evaluation family (docs/schedule-generation-evaluation.md, L2-212): Christian and
/// doesn't celebrate Halloween; home 2091 Hurontario St, Mississauga; Dad 45, Mom 43, Ava 10, Mia 6;
/// Aqua Tots Heartland swims on Sunday (Mia 16:20-16:50, Ava 17:00-17:30) at 5980 McLaughlin Rd;
/// max drive two hours.
/// </summary>
internal static class Persona
{
    public const string Home = "2091 Hurontario St, Mississauga L5A 4E6";
    public const string Heartland = "5980 McLaughlin Rd, Mississauga";

    public sealed record Family(SignedInClient.Session Session, Guid FamilyId, IReadOnlyDictionary<string, Guid> Members);

    public static async Task<Family> CreateAsync(SaturdazeApiFactory factory, bool overlappingSwims = false)
    {
        factory.Geocoder.Add(Home, 43.5711m, -79.6024m);
        factory.Geocoder.Add(Heartland, 43.6082m, -79.6930m);
        var session = await SignedInClient.CreateAsync(factory, FamilyMode.Own);

        var saved = await FamilyProfiles.SaveAsync(session.Client, new
        {
            HomeLocation = Home,
            MaxDriveMinutes = 120,
            ExcludedThemes = new[] { "halloween" },
            Members = new[]
            {
                new { Name = "Dad", Age = 45 }, new { Name = "Mom", Age = 43 },
                new { Name = "Ava", Age = 10 }, new { Name = "Mia", Age = 6 },
            },
        });
        var members = saved.GetProperty("members").EnumerateArray()
            .ToDictionary(m => m.GetProperty("name").GetString()!, m => m.GetProperty("id").GetGuid());

        await FamilyProfiles.SaveAsync(session.Client, new
        {
            Commitments = new[]
            {
                new { Title = "Swim — Mia", DayOfWeek = "Sunday", StartTime = "16:20", EndTime = "16:50", AttendeeMemberIds = new[] { members["Mia"] }, Location = new { Address = Heartland } },
                overlappingSwims
                    ? new { Title = "Swim — Ava", DayOfWeek = "Sunday", StartTime = "16:30", EndTime = "17:00", AttendeeMemberIds = new[] { members["Ava"] }, Location = new { Address = Heartland } }
                    : new { Title = "Swim — Ava", DayOfWeek = "Sunday", StartTime = "17:00", EndTime = "17:30", AttendeeMemberIds = new[] { members["Ava"] }, Location = new { Address = Heartland } },
            },
        });
        return new Family(session, session.FamilyId!.Value, members);
    }
}

/// <summary>Requests a draft and waits for it to end, as the Weekend page does.</summary>
internal static class AgentDrafts
{
    public static readonly string[] Terminal = { "Applied", "FellBack" };

    public static async Task<HttpResponseMessage> RequestAsync(HttpClient client, Guid weekendId) =>
        await client.PostAsync($"/api/weekends/{weekendId}/drafts", content: null);

    public static async Task<JsonElement> WaitAsync(HttpClient client, Guid weekendId, TimeSpan? timeout = null)
    {
        var until = DateTime.UtcNow + (timeout ?? TimeSpan.FromSeconds(30));
        while (true)
        {
            var response = await client.GetAsync($"/api/weekends/{weekendId}/drafts/latest");
            if (response.IsSuccessStatusCode)
            {
                var run = await Plans.ReadAsync(response);
                if (Terminal.Contains(run.GetProperty("status").GetString())) return run;
            }
            if (DateTime.UtcNow > until) throw new TimeoutException("The draft did not end in time.");
            await Task.Delay(200);
        }
    }

    /// <summary>Plans the weekend, drafts it with the agents and returns the run and the weekend after.</summary>
    public static async Task<(JsonElement Run, JsonElement Weekend)> DraftAsync(HttpClient client, string weekendOf)
    {
        var weekend = await Plans.PlanAsync(client, weekendOf);
        var request = await RequestAsync(client, Plans.Id(weekend));
        var body = await request.Content.ReadAsStringAsync();
        if ((int)request.StatusCode != 202) throw new InvalidOperationException($"Draft request answered {(int)request.StatusCode}: {body}");
        var run = await WaitAsync(client, Plans.Id(weekend));
        return (run, await Plans.ReadAsync(await client.GetAsync($"/api/weekends/{Plans.Id(weekend)}")));
    }
}
