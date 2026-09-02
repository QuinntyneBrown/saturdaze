using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Families;

public class FamilyControllerTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public FamilyControllerTests(SaturdazeApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Get_returns_seeded_family()
    {
        // Traces to: L2-009 #1, #2
        var session = await SignedInClient.CreateAsync(_factory);
        var response = await session.Client.GetAsync("/api/family");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var payload = JsonDocument.Parse(body).RootElement;
        payload.GetProperty("homeLocation").GetString().Should().Contain("Port Credit");
        payload.GetProperty("members").GetArrayLength().Should().BeGreaterThan(0);
        payload.GetProperty("commitments").GetArrayLength().Should().BeGreaterThan(0);
        payload.GetProperty("preferences").GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Get_without_bearer_returns_401()
    {
        // Traces to: L2-009 #3
        var response = await _factory.CreateClient().GetAsync("/api/family");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Put_updates_family_and_returns_updated_profile()
    {
        var session = await SignedInClient.CreateAsync(_factory);
        var update = new
        {
            HomeLocation = "Port Credit, Mississauga, ON",
            BudgetEnabled = true,
            Members = new[]
            {
                new { Name = "Quinn", Age = 42 },
                new { Name = "Jennifer", Age = 40 },
                new { Name = "Theo",  Age = 10 },
                new { Name = "Avery", Age = 6 }
            },
            Commitments = new[]
            {
                new { Title = "Kids swim lesson", DayOfWeek = "Saturday", StartTime = "09:30:00", EndTime = "10:30:00" }
            },
            Preferences = new[]
            {
                new { Kind = "Like", Value = "outdoors" }
            }
        };

        var response = await session.Client.PutAsJsonAsync("/api/family", update);
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);

        var payload = JsonDocument.Parse(body).RootElement;
        payload.GetProperty("budgetEnabled").GetBoolean().Should().BeTrue();
        var members = payload.GetProperty("members").EnumerateArray()
            .Select(m => (m.GetProperty("name").GetString(), m.GetProperty("age").GetInt32()))
            .ToArray();
        members.Should().Contain(("Theo", 10));
        members.Should().Contain(("Avery", 6));
    }

    [Fact]
    public async Task Put_renames_a_member_in_place_when_its_id_is_supplied()
    {
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var seed = await session.Client.PutAsJsonAsync("/api/family", new
        {
            HomeLocation = "Somewhere",
            BudgetEnabled = false,
            Members = new[] { new { Name = "Sam", Age = 7 } },
            Commitments = Array.Empty<object>(),
            Preferences = Array.Empty<object>()
        });
        seed.EnsureSuccessStatusCode();
        var member = JsonDocument.Parse(await seed.Content.ReadAsStringAsync()).RootElement
            .GetProperty("members").EnumerateArray().Single();
        var memberId = member.GetProperty("id").GetGuid();

        var rename = await session.Client.PutAsJsonAsync("/api/family", new
        {
            HomeLocation = "Somewhere",
            BudgetEnabled = false,
            Members = new[] { new { Id = memberId, Name = "Samuel", Age = 8 } },
            Commitments = Array.Empty<object>(),
            Preferences = Array.Empty<object>()
        });
        rename.EnsureSuccessStatusCode();
        var renamed = JsonDocument.Parse(await rename.Content.ReadAsStringAsync()).RootElement
            .GetProperty("members").EnumerateArray().Single();
        renamed.GetProperty("id").GetGuid().Should().Be(memberId);
        renamed.GetProperty("name").GetString().Should().Be("Samuel");
        renamed.GetProperty("age").GetInt32().Should().Be(8);
    }

    [Fact]
    public async Task Put_first_time_creates_and_links_family()
    {
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.None);

        var before = await session.Client.GetAsync("/api/family");
        before.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var put = await session.Client.PutAsJsonAsync("/api/family", new
        {
            HomeLocation = "Clarkson",
            BudgetEnabled = false,
            Members = new[] { new { Name = "Ada", Age = 6 } },
            Commitments = Array.Empty<object>(),
            Preferences = Array.Empty<object>()
        });
        put.StatusCode.Should().Be(HttpStatusCode.OK, await put.Content.ReadAsStringAsync());
        var familyId = JsonDocument.Parse(await put.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.SingleAsync(u => u.Id == session.UserId);
            user.FamilyId.Should().Be(familyId);
        }

        var after = await session.Client.GetAsync("/api/family");
        after.StatusCode.Should().Be(HttpStatusCode.OK);
        JsonDocument.Parse(await after.Content.ReadAsStringAsync()).RootElement
            .GetProperty("homeLocation").GetString().Should().Be("Clarkson");
    }

    [Fact]
    public async Task Put_persists_name_and_preference_toggles()
    {
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var put = await session.Client.PutAsJsonAsync("/api/family", new
        {
            Name = "The Tests",
            HomeLocation = "Clarkson",
            BudgetEnabled = true,
            TryNewEnabled = true,
            FridayPreviewEnabled = false,
            Members = Array.Empty<object>(),
            Commitments = Array.Empty<object>(),
            Preferences = Array.Empty<object>()
        });
        put.StatusCode.Should().Be(HttpStatusCode.OK, await put.Content.ReadAsStringAsync());

        var get = JsonDocument.Parse(await (await session.Client.GetAsync("/api/family")).Content.ReadAsStringAsync()).RootElement;
        get.GetProperty("name").GetString().Should().Be("The Tests");
        get.GetProperty("tryNewEnabled").GetBoolean().Should().BeTrue();
        get.GetProperty("fridayPreviewEnabled").GetBoolean().Should().BeFalse();
        get.GetProperty("budgetEnabled").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task Registration_stores_the_family_name_and_friday_preference()
    {
        // Traces to: L2-001
        var anon = _factory.CreateClient();
        var email = $"named-{Guid.NewGuid():N}@example.com";
        var reg = await anon.PostAsJsonAsync("/api/auth/register",
            new { Email = email, Password = "password123", FamilyName = "The Registrants", HomeLocation = "Lorne Park", FridayPreview = false });
        reg.EnsureSuccessStatusCode();
        var token = JsonDocument.Parse(await reg.Content.ReadAsStringAsync()).RootElement
            .GetProperty("token").GetProperty("accessToken").GetString();

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var family = JsonDocument.Parse(await (await client.GetAsync("/api/family")).Content.ReadAsStringAsync()).RootElement;
        family.GetProperty("name").GetString().Should().Be("The Registrants");
        family.GetProperty("homeLocation").GetString().Should().Be("Lorne Park");
        family.GetProperty("fridayPreviewEnabled").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task Put_with_invalid_payload_returns_400_with_field_errors()
    {
        var session = await SignedInClient.CreateAsync(_factory);
        var bad = new
        {
            HomeLocation = "",
            BudgetEnabled = false,
            Members = new[] { new { Name = "X", Age = 9 }, new { Name = "x", Age = 9 } },
            Commitments = Array.Empty<object>(),
            Preferences = Array.Empty<object>()
        };

        var response = await session.Client.PutAsJsonAsync("/api/family", bad);
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");

        var payload = JsonDocument.Parse(body).RootElement;
        payload.GetProperty("errors").EnumerateObject().Should().NotBeEmpty();
    }

    [Fact]
    public async Task Put_missing_collections_returns_400_not_500()
    {
        var session = await SignedInClient.CreateAsync(_factory);
        var response = await session.Client.PutAsJsonAsync("/api/family", new { HomeLocation = "Port Credit", BudgetEnabled = false });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, await response.Content.ReadAsStringAsync());
    }
}
