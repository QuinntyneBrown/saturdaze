using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Families;

public class FamilyControllerTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly HttpClient _client;

    public FamilyControllerTests(SaturdazeApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Get_returns_seeded_family()
    {
        var response = await _client.GetAsync("/api/family");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var payload = JsonDocument.Parse(body).RootElement;
        payload.GetProperty("homeLocation").GetString().Should().Contain("Port Credit");
        payload.GetProperty("members").GetArrayLength().Should().BeGreaterThan(0);
        payload.GetProperty("commitments").GetArrayLength().Should().BeGreaterThan(0);
        payload.GetProperty("preferences").GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Put_updates_family_and_returns_updated_profile()
    {
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

        var response = await _client.PutAsJsonAsync("/api/family", update);
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
    public async Task Put_with_invalid_payload_returns_400_with_field_errors()
    {
        var bad = new
        {
            HomeLocation = "",
            BudgetEnabled = false,
            Members = new[] { new { Name = "X", Age = 9 }, new { Name = "x", Age = 9 } },
            Commitments = Array.Empty<object>(),
            Preferences = Array.Empty<object>()
        };

        var response = await _client.PutAsJsonAsync("/api/family", bad);
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");

        var payload = JsonDocument.Parse(body).RootElement;
        payload.GetProperty("errors").EnumerateObject().Should().NotBeEmpty();
    }
}
