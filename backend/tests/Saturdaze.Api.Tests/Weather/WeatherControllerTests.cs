using System.Net;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Weather;

public class WeatherControllerTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    private readonly HttpClient _client;

    public WeatherControllerTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Returns_sat_and_sun_forecasts()
    {
        _factory.Weather.Producer = (_, _, from, to) => new[]
        {
            new WeatherForecast(from,             new[] { "rain", "cool" }, 14, 8, 4.2, false),
            new WeatherForecast(from.AddDays(1),  new[] { "sunny", "warm" }, 24, 16, 0.0, false)
        };

        var response = await _client.GetAsync("/api/weather?weekendOf=2026-05-16");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);

        var arr = JsonDocument.Parse(body).RootElement.EnumerateArray().ToArray();
        arr.Should().HaveCount(2);
        arr[0].GetProperty("date").GetString().Should().Be("2026-05-16");
        arr[1].GetProperty("date").GetString().Should().Be("2026-05-17");
        arr[0].GetProperty("tags").EnumerateArray().Select(e => e.GetString())
            .Should().BeEquivalentTo("rain", "cool");
    }

    [Fact]
    public async Task Unavailable_forecast_is_surfaced_with_flag()
    {
        _factory.Weather.Producer = (_, _, from, to) => new[]
        {
            new WeatherForecast(from,            Array.Empty<string>(), null, null, null, Unavailable: true),
            new WeatherForecast(from.AddDays(1), Array.Empty<string>(), null, null, null, Unavailable: true)
        };

        var response = await _client.GetAsync("/api/weather?weekendOf=2026-05-16");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);

        var arr = JsonDocument.Parse(body).RootElement.EnumerateArray().ToArray();
        arr.Should().OnlyContain(e => e.GetProperty("unavailable").GetBoolean());
    }
}
