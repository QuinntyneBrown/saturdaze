using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Saturdaze.Infrastructure.Weather;
using Xunit;

namespace Saturdaze.Infrastructure.Tests.Weather;

public class OpenMeteoWeatherClientTests
{
    [Fact]
    public async Task Calls_open_meteo_and_maps_response()
    {
        const string sampleJson = """
        {
          "daily": {
            "time": ["2026-05-16", "2026-05-17"],
            "weather_code": [0, 61],
            "temperature_2m_max": [25.0, 12.0],
            "temperature_2m_min": [15.0, 8.0],
            "precipitation_sum": [0.0, 4.5]
          }
        }
        """;

        var handler = new FakeHttpMessageHandler(sampleJson);
        var http = new HttpClient(handler) { BaseAddress = new Uri("https://api.open-meteo.com/v1/") };
        var cache = new MemoryCache(new MemoryCacheOptions());
        var client = new OpenMeteoWeatherClient(http, cache, NullLogger<OpenMeteoWeatherClient>.Instance, TimeSpan.FromMinutes(60));

        var fc = await client.GetForecastAsync(43.5547, -79.5816, new DateOnly(2026, 5, 16), new DateOnly(2026, 5, 17));

        fc.Should().HaveCount(2);
        fc[0].Tags.Should().Contain("sunny").And.Contain("warm");
        fc[1].Tags.Should().Contain("rain").And.Contain("cool");
        fc.Should().OnlyContain(f => !f.Unavailable);

        handler.Calls.Should().Be(1);
        handler.LastUrl.Should().NotBeNull();
        handler.LastUrl!.OriginalString.Should()
            .Contain("latitude=43.5547")
            .And.Contain("longitude=-79.5816")
            .And.Contain("start_date=2026-05-16")
            .And.Contain("end_date=2026-05-17");
    }

    [Fact]
    public async Task Caches_response_for_repeat_calls()
    {
        var handler = new FakeHttpMessageHandler("""{"daily":{"time":[],"weather_code":[],"temperature_2m_max":[],"temperature_2m_min":[],"precipitation_sum":[]}}""");
        var http = new HttpClient(handler) { BaseAddress = new Uri("https://api.open-meteo.com/v1/") };
        var cache = new MemoryCache(new MemoryCacheOptions());
        var client = new OpenMeteoWeatherClient(http, cache, NullLogger<OpenMeteoWeatherClient>.Instance, TimeSpan.FromMinutes(60));

        await client.GetForecastAsync(43.5, -79.6, new DateOnly(2026, 5, 16), new DateOnly(2026, 5, 17));
        await client.GetForecastAsync(43.5, -79.6, new DateOnly(2026, 5, 16), new DateOnly(2026, 5, 17));
        handler.Calls.Should().Be(1);
    }

    [Fact]
    public async Task Returns_unavailable_when_upstream_fails()
    {
        var handler = new FakeHttpMessageHandler(throwOnSend: true);
        var http = new HttpClient(handler) { BaseAddress = new Uri("https://api.open-meteo.com/v1/") };
        var cache = new MemoryCache(new MemoryCacheOptions());
        var client = new OpenMeteoWeatherClient(http, cache, NullLogger<OpenMeteoWeatherClient>.Instance, TimeSpan.FromMinutes(60));

        var fc = await client.GetForecastAsync(43.5, -79.6, new DateOnly(2026, 5, 16), new DateOnly(2026, 5, 17));
        fc.Should().HaveCount(2);
        fc.Should().OnlyContain(f => f.Unavailable);
    }

    [Trait("Category", "Live")]
    [Fact(Skip = "Opt-in: hits live Open-Meteo. Run manually to catch contract drift.")]
    public async Task Live_open_meteo_contract_smoke()
    {
        var http = new HttpClient { BaseAddress = new Uri("https://api.open-meteo.com/v1/") };
        var cache = new MemoryCache(new MemoryCacheOptions());
        var client = new OpenMeteoWeatherClient(http, cache, NullLogger<OpenMeteoWeatherClient>.Instance, TimeSpan.FromMinutes(60));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var fc = await client.GetForecastAsync(43.5547, -79.5816, today, today.AddDays(1));
        fc.Should().HaveCount(2);
        fc.Should().OnlyContain(f => !f.Unavailable);
    }

    private sealed class FakeHttpMessageHandler : HttpMessageHandler
    {
        private readonly string? _body;
        private readonly bool _throw;

        public FakeHttpMessageHandler(string body) { _body = body; _throw = false; }
        public FakeHttpMessageHandler(bool throwOnSend) { _body = null; _throw = throwOnSend; }

        public int Calls { get; private set; }
        public Uri? LastUrl { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            LastUrl = request.RequestUri;
            if (_throw) throw new HttpRequestException("simulated failure");
            return Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new StringContent(_body ?? "{}", System.Text.Encoding.UTF8, "application/json")
            });
        }
    }
}
