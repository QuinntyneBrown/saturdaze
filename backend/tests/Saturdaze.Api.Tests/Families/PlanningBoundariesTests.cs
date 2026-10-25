// Acceptance Test
// Traces to: L2-191 AC4, AC5, L2-192 AC1, AC2, AC3, AC4, AC6, L2-194 AC6, L2-195 AC5, L2-196 AC2, AC3
// Description: The family saves and reads its planning boundaries through PUT and GET /api/family.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Families;

public class PlanningBoundariesTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public PlanningBoundariesTests(SaturdazeApiFactory factory) => _factory = factory;

    private static async Task<JsonElement> GetFamily(HttpClient client) =>
        await Plans.ReadAsync(await client.GetAsync("/api/family"));

    private static async Task<(HttpStatusCode Status, string Body)> Put(HttpClient client, object body)
    {
        var response = await client.PutAsJsonAsync("/api/family", body);
        return (response.StatusCode, await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task A_family_that_never_set_its_boundaries_gets_the_defaults()
    {
        // Traces to: L2-191 AC5, L2-195
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var family = await GetFamily(session.Client);

        family.GetProperty("maxDriveMinutes").GetInt32().Should().Be(120);
        family.GetProperty("excludedThemes").GetArrayLength().Should().Be(0);
        family.GetProperty("quietSunday").GetBoolean().Should().BeFalse();
        family.GetProperty("dayStart").GetString().Should().Be("09:00:00");
        family.GetProperty("youngestBedtime").ValueKind.Should().Be(JsonValueKind.Null);
        family.GetProperty("sundayDinnerAtHome").GetBoolean().Should().BeTrue();
        family.GetProperty("outingsPerDay").GetInt32().Should().Be(2);
        family.GetProperty("leaning").GetString().Should().Be("Either");
    }

    [Fact]
    public async Task The_family_saves_its_boundaries_and_reads_them_back()
    {
        // Traces to: L2-191, L2-194, L2-195
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        await FamilyProfiles.SaveAsync(session.Client, new
        {
            MaxDriveMinutes = 90,
            ExcludedThemes = new[] { "halloween" },
            QuietSunday = true,
            DayStart = "10:00",
            YoungestBedtime = "19:30",
            SundayDinnerAtHome = false,
            OutingsPerDay = 3,
            Leaning = "Indoor",
        });
        var family = await GetFamily(session.Client);

        family.GetProperty("maxDriveMinutes").GetInt32().Should().Be(90);
        family.GetProperty("excludedThemes").EnumerateArray().Select(t => t.GetString()).Should().Equal("halloween");
        family.GetProperty("quietSunday").GetBoolean().Should().BeTrue();
        family.GetProperty("dayStart").GetString().Should().Be("10:00:00");
        family.GetProperty("youngestBedtime").GetString().Should().Be("19:30:00");
        family.GetProperty("sundayDinnerAtHome").GetBoolean().Should().BeFalse();
        family.GetProperty("outingsPerDay").GetInt32().Should().Be(3);
        family.GetProperty("leaning").GetString().Should().Be("Indoor");
    }

    [Theory]
    [InlineData("maxDriveMinutes", 10)]
    [InlineData("maxDriveMinutes", 300)]
    [InlineData("outingsPerDay", 4)]
    public async Task Out_of_range_numbers_are_refused(string field, int value)
    {
        // Traces to: L2-191 AC4, L2-195 AC5
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var (status, body) = await Put(session.Client, new Dictionary<string, object> { [field] = value });

        status.Should().Be(HttpStatusCode.BadRequest);
        body.Should().ContainEquivalentOf(field);
    }

    [Theory]
    [InlineData("dayStart", "06:00")]
    [InlineData("dayStart", "09:15")]
    [InlineData("youngestBedtime", "23:00")]
    public async Task Out_of_range_times_are_refused(string field, string value)
    {
        // Traces to: L2-195 AC5
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var (status, body) = await Put(session.Client, new Dictionary<string, object> { [field] = value });

        status.Should().Be(HttpStatusCode.BadRequest);
        body.Should().ContainEquivalentOf(field);
    }

    [Fact]
    public async Task A_theme_outside_the_vocabulary_is_refused()
    {
        // Traces to: L2-194 AC6
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var (status, body) = await Put(session.Client, new { ExcludedThemes = new[] { "birthdays" } });

        status.Should().Be(HttpStatusCode.BadRequest);
        body.Should().ContainEquivalentOf("excludedThemes");
    }

    [Fact]
    public async Task Members_keep_their_interests()
    {
        // Traces to: L2-196 AC2
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        await FamilyProfiles.SaveAsync(session.Client, new
        {
            Members = new[] { new { Name = "Ava", Age = 10, Interests = new[] { "animals" } } },
        });
        var family = await GetFamily(session.Client);

        family.GetProperty("members").EnumerateArray().Single()
            .GetProperty("interests").EnumerateArray().Select(i => i.GetString()).Should().Equal("animals");
    }

    [Fact]
    public async Task Nine_interests_are_too_many()
    {
        // Traces to: L2-196 AC3
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var (status, _) = await Put(session.Client, new
        {
            Members = new[] { new { Name = "Ava", Age = 10, Interests = Enumerable.Range(1, 9).Select(i => $"thing {i}").ToArray() } },
        });

        status.Should().Be(HttpStatusCode.BadRequest);
    }

    private static object Swims(Guid mia, Guid ava, string avaStart = "16:30", string avaEnd = "17:00") => new[]
    {
        new { Title = "Swim — Mia", DayOfWeek = "Sunday", StartTime = "16:20", EndTime = "16:50", AttendeeMemberIds = new[] { mia } },
        new { Title = "Swim — Ava", DayOfWeek = "Sunday", StartTime = avaStart, EndTime = avaEnd, AttendeeMemberIds = new[] { ava } },
    };

    private static async Task<Dictionary<string, Guid>> SaveMembers(HttpClient client, params (string Name, int Age)[] members)
    {
        var family = await FamilyProfiles.SaveAsync(client, new { Members = members.Select(m => new { m.Name, m.Age }).ToArray() });
        return family.GetProperty("members").EnumerateArray()
            .ToDictionary(m => m.GetProperty("name").GetString()!, m => m.GetProperty("id").GetGuid());
    }

    [Fact]
    public async Task Overlapping_commitments_for_different_children_are_allowed_when_two_adults_can_split()
    {
        // Traces to: L2-192 AC1
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var ids = await SaveMembers(session.Client, ("Dad", 45), ("Mom", 43), ("Ava", 10), ("Mia", 6));

        var (status, body) = await Put(session.Client, new { Commitments = Swims(ids["Mia"], ids["Ava"]) });

        status.Should().Be(HttpStatusCode.OK, body);
        var commitments = (await GetFamily(session.Client)).GetProperty("commitments").EnumerateArray().ToList();
        commitments.Should().HaveCount(2);
        commitments.Single(c => c.GetProperty("title").GetString() == "Swim — Mia")
            .GetProperty("attendeeMemberIds").EnumerateArray().Select(i => i.GetGuid()).Should().Equal(ids["Mia"]);
    }

    [Fact]
    public async Task One_adult_cannot_take_two_children_to_overlapping_commitments()
    {
        // Traces to: L2-192 AC2
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var ids = await SaveMembers(session.Client, ("Mom", 43), ("Ava", 10), ("Mia", 6));

        var (status, body) = await Put(session.Client, new { Commitments = Swims(ids["Mia"], ids["Ava"]) });

        status.Should().Be(HttpStatusCode.BadRequest);
        body.Should().Contain("an adult can take each");
    }

    [Fact]
    public async Task Overlapping_commitments_for_everyone_are_refused()
    {
        // Traces to: L2-192 AC3
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var (status, _) = await Put(session.Client, new
        {
            Commitments = new[]
            {
                new { Title = "Swim", DayOfWeek = "Sunday", StartTime = "16:20", EndTime = "16:50" },
                new { Title = "Choir", DayOfWeek = "Sunday", StartTime = "16:30", EndTime = "17:00" },
            },
        });

        status.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task An_attendee_from_another_family_is_refused()
    {
        // Traces to: L2-192 AC4
        var other = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var otherIds = await SaveMembers(other.Client, ("Zed", 30));
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        await SaveMembers(session.Client, ("Mom", 43));

        var (status, _) = await Put(session.Client, new
        {
            Commitments = new[]
            {
                new { Title = "Swim", DayOfWeek = "Sunday", StartTime = "16:20", EndTime = "16:50", AttendeeMemberIds = new[] { otherIds["Zed"] } },
            },
        });

        status.Should().Be(HttpStatusCode.BadRequest);
        (await GetFamily(session.Client)).GetProperty("commitments").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task A_commitment_place_is_geocoded_on_save()
    {
        // Traces to: L2-192 AC6
        _factory.Geocoder.Add("5980 McLaughlin Rd, Mississauga", 43.6297m, -79.7127m);
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        await FamilyProfiles.SaveAsync(session.Client, new
        {
            Commitments = new[]
            {
                new { Title = "Swim", DayOfWeek = "Sunday", StartTime = "16:20", EndTime = "16:50", Location = new { Address = "5980 McLaughlin Rd, Mississauga" } },
            },
        });

        var location = (await GetFamily(session.Client)).GetProperty("commitments").EnumerateArray().Single().GetProperty("location");
        location.GetProperty("latitude").GetDecimal().Should().Be(43.6297m);
        location.GetProperty("longitude").GetDecimal().Should().Be(-79.7127m);
        location.GetProperty("address").GetString().Should().Be("5980 McLaughlin Rd, Mississauga");
    }
}
