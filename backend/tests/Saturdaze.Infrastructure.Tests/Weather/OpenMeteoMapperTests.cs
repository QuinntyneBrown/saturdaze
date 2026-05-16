using FluentAssertions;
using Saturdaze.Infrastructure.Weather;
using Xunit;

namespace Saturdaze.Infrastructure.Tests.Weather;

public class OpenMeteoMapperTests
{
    [Theory]
    [InlineData(0,  null, "sunny")]
    [InlineData(2,  null, null)]      // partly cloudy → no precip tag
    [InlineData(61, null, "rain")]
    [InlineData(80, null, "rain")]
    [InlineData(75, null, "snow")]
    [InlineData(85, null, "snow")]
    [InlineData(95, null, "rain")]
    [InlineData(null, 1.5, "rain")]   // precip threshold without code
    public void Maps_weather_code_and_precip_to_tag(int? code, double? precip, string? expectedTag)
    {
        var resp = SingleDay(date: "2026-05-16", code: code, max: 18, min: 10, precip: precip);
        var fc = OpenMeteoMapper.Map(resp, new DateOnly(2026, 5, 16), new DateOnly(2026, 5, 16))[0];
        if (expectedTag is null)
            fc.Tags.Should().NotContain(new[] { "rain", "snow", "sunny" });
        else
            fc.Tags.Should().Contain(expectedTag);
    }

    [Theory]
    [InlineData(4.0, "cold")]
    [InlineData(10.0, "cool")]
    [InlineData(20.0, "mild")]
    [InlineData(25.0, "warm")]
    public void Maps_high_temperature_to_band(double high, string expected)
    {
        var resp = SingleDay(date: "2026-05-16", code: 2, max: high, min: high - 5, precip: 0);
        var fc = OpenMeteoMapper.Map(resp, new DateOnly(2026, 5, 16), new DateOnly(2026, 5, 16))[0];
        fc.Tags.Should().Contain(expected);
    }

    [Fact]
    public void Missing_day_in_response_returns_unavailable_for_that_date()
    {
        var resp = SingleDay(date: "2026-05-16", code: 0, max: 20, min: 10, precip: 0);
        var fcs = OpenMeteoMapper.Map(resp, new DateOnly(2026, 5, 16), new DateOnly(2026, 5, 17));
        fcs.Should().HaveCount(2);
        fcs[0].Unavailable.Should().BeFalse();
        fcs[1].Unavailable.Should().BeTrue();
    }

    private static OpenMeteoResponse SingleDay(string date, int? code, double? max, double? min, double? precip) =>
        new()
        {
            Daily = new OpenMeteoDaily
            {
                Time = new[] { date },
                WeatherCode = new[] { code },
                Temperature2mMax = new[] { max },
                Temperature2mMin = new[] { min },
                PrecipitationSum = new[] { precip }
            }
        };
}
