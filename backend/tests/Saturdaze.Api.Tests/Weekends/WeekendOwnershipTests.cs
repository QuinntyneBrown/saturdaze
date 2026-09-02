// Traces to: L2-009, L2-014 #4
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Weekends;

/// <summary>
/// A weekend (and everything hanging off it) is only reachable by the family
/// that owns it. Another family's requests are 404s — never a leak, never a
/// mutation.
/// </summary>
public class WeekendOwnershipTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public WeekendOwnershipTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = (_, _, from, to) =>
        {
            var days = new List<WeatherForecast>();
            for (var d = from; d <= to; d = d.AddDays(1))
                days.Add(new WeatherForecast(d, new[] { "sunny", "warm" }, 24, 16, 0.0, false));
            return days;
        };
    }

    [Fact]
    public async Task Another_family_gets_404_from_every_weekend_block_and_errand_route()
    {
        var owner = await SignedInClient.CreateAsync(_factory);
        var intruder = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var saturday = new DateOnly(2026, 8, 8);
        var plan = await owner.Client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = saturday.ToString("yyyy-MM-dd") });
        plan.EnsureSuccessStatusCode();
        var planned = await ReadAsync(plan);
        var weekendId = planned.GetProperty("id").GetGuid();
        var blockId = planned.GetProperty("blocks").EnumerateArray()
            .First(b => b.GetProperty("kind").GetString() == "Activity")
            .GetProperty("id").GetGuid();

        var add = await owner.Client.PostAsJsonAsync($"/api/weekends/{weekendId}/errands",
            new { Description = "Costco run", EstimatedMinutes = 45 });
        add.EnsureSuccessStatusCode();
        var errandId = (await ReadAsync(add)).GetProperty("errands").EnumerateArray().Single().GetProperty("id").GetGuid();

        var attempts = new (HttpMethod Method, string Url, object? Body)[]
        {
            (HttpMethod.Get,  $"/api/weekends/{weekendId}", null),
            (HttpMethod.Post, $"/api/weekends/{weekendId}/regenerate", null),
            (HttpMethod.Post, $"/api/weekends/{weekendId}/days/saturday/regenerate", null),
            (HttpMethod.Put,  $"/api/weekends/{weekendId}/days/saturday/lock", new { Locked = true }),
            (HttpMethod.Put,  $"/api/weekends/{weekendId}/favourite", new { Favourite = true }),
            (HttpMethod.Post, $"/api/weekends/{weekendId}/share", null),
            (HttpMethod.Post, $"/api/weekends/{weekendId}/repeat", null),
            (HttpMethod.Post, $"/api/weekends/{weekendId}/remix", null),
            (HttpMethod.Post, $"/api/weekends/{weekendId}/errands", new { Description = "Milk", EstimatedMinutes = 30 }),
            (HttpMethod.Put,  $"/api/errands/{errandId}/done", new { Done = true }),
            (HttpMethod.Put,  $"/api/blocks/{blockId}/lock", new { Locked = true }),
            (HttpMethod.Post, $"/api/blocks/{blockId}/swap", new { RejectedActivityIds = Array.Empty<Guid>() }),
        };

        foreach (var (method, url, body) in attempts)
        {
            using var request = new HttpRequestMessage(method, url);
            if (body is not null) request.Content = JsonContent.Create(body);
            var response = await intruder.Client.SendAsync(request);
            response.StatusCode.Should().Be(HttpStatusCode.NotFound, $"{method} {url}");
        }

        // Nothing leaked and nothing changed for the owner.
        var reload = await ReadAsync(await owner.Client.GetAsync($"/api/weekends/{weekendId}"));
        reload.GetProperty("isFavourite").GetBoolean().Should().BeFalse();
        reload.GetProperty("errands").EnumerateArray().Should().ContainSingle();
        reload.GetProperty("blocks").EnumerateArray()
            .Single(b => b.GetProperty("id").GetGuid() == blockId)
            .GetProperty("isLocked").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task History_is_isolated_per_family()
    {
        var a = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var b = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var saturday = new DateOnly(2026, 8, 15).ToString("yyyy-MM-dd");

        var aId = (await ReadAsync(await a.Client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = saturday }))).GetProperty("id").GetGuid();
        var bId = (await ReadAsync(await b.Client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = saturday }))).GetProperty("id").GetGuid();

        aId.Should().NotBe(bId, "each family gets its own weekend for the same date");

        var aHistory = (await ReadAsync(await a.Client.GetAsync("/api/weekends/history")))
            .EnumerateArray().Select(w => w.GetProperty("id").GetGuid()).ToArray();
        var bHistory = (await ReadAsync(await b.Client.GetAsync("/api/weekends/history")))
            .EnumerateArray().Select(w => w.GetProperty("id").GetGuid()).ToArray();

        aHistory.Should().Contain(aId).And.NotContain(bId);
        bHistory.Should().Contain(bId).And.NotContain(aId);
    }

    [Fact]
    public async Task Direct_weekend_read_requires_a_bearer_but_share_and_calendar_do_not()
    {
        var owner = await SignedInClient.CreateAsync(_factory);
        var saturday = new DateOnly(2026, 8, 22).ToString("yyyy-MM-dd");
        var weekendId = (await ReadAsync(await owner.Client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = saturday })))
            .GetProperty("id").GetGuid();
        var token = (await ReadAsync(await owner.Client.PostAsync($"/api/weekends/{weekendId}/share", content: null)))
            .GetProperty("token").GetString();

        var anonymous = _factory.CreateClient();
        (await anonymous.GetAsync($"/api/weekends/{weekendId}")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await anonymous.GetAsync($"/api/weekends/shared/{token}")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await anonymous.GetAsync($"/api/weekends/{weekendId}/calendar.ics")).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private static async Task<JsonElement> ReadAsync(HttpResponseMessage resp)
        => JsonDocument.Parse(await resp.Content.ReadAsStringAsync()).RootElement;
}
