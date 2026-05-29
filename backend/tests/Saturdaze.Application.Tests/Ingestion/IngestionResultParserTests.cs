using FluentAssertions;
using Saturdaze.Application.Ingestion;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Ingestion;

public class IngestionResultParserTests
{
    private readonly IngestionResultParser _sut = new();

    [Fact]
    public void Parses_a_clean_event_array()
    {
        const string json = """
            [
              {"name":"Buskerfest","startsOn":"2026-08-15","endsOn":"2026-08-16",
               "location":"Port Credit","driveMinutes":3,"url":"https://x","category":"Festival"}
            ]
            """;

        var result = _sut.Parse(json, IngestionType.Events);

        result.Considered.Should().Be(1);
        result.Rejected.Should().Be(0);
        result.Items.Should().ContainSingle();
        result.Items[0].DisplayName.Should().Be("Buskerfest");
        result.Items[0].NaturalKey.Should().Be("buskerfest|2026-08-15|port credit");
    }

    [Fact]
    public void Extracts_the_array_even_when_wrapped_in_prose_and_fences()
    {
        const string text = """
            Here are the events I found this weekend:

            ```json
            [ {"name":"Tulip Festival","startsOn":"2026-05-16","endsOn":"2026-05-17","location":"RBG"} ]
            ```

            Let me know if you'd like more.
            """;

        var result = _sut.Parse(text, IngestionType.Events);

        result.Items.Should().ContainSingle();
        result.Items[0].DisplayName.Should().Be("Tulip Festival");
    }

    [Fact]
    public void Rejects_rows_missing_required_fields_but_keeps_the_good_ones()
    {
        const string json = """
            [
              {"name":"Good","startsOn":"2026-08-15","location":"Here"},
              {"name":"No date","location":"Here"},
              {"startsOn":"2026-08-15","location":"No name"},
              {"name":"No location","startsOn":"2026-08-15"}
            ]
            """;

        var result = _sut.Parse(json, IngestionType.Events);

        result.Considered.Should().Be(4);
        result.Items.Should().ContainSingle(i => i.DisplayName == "Good");
        result.Rejected.Should().Be(3);
    }

    [Fact]
    public void Defaults_missing_event_end_date_to_start_date()
    {
        const string json = """[ {"name":"One Day","startsOn":"2026-08-15","location":"Here"} ]""";

        var item = _sut.Parse(json, IngestionType.Events).Items.Single();

        item.Payload["endsOn"]!.GetValue<string>().Should().Be("2026-08-15");
    }

    [Fact]
    public void Restaurant_slot_is_validated_and_normalised()
    {
        const string json = """
            [
              {"name":"La Marina","slot":"lunch","style":"Patio"},
              {"name":"Mystery","slot":"brunch"}
            ]
            """;

        var result = _sut.Parse(json, IngestionType.Restaurants);

        result.Items.Should().ContainSingle();
        result.Items[0].NaturalKey.Should().Be("la marina|lunch");
        result.Items[0].Payload["slot"]!.GetValue<string>().Should().Be("Lunch"); // normalised casing
        result.Rejected.Should().Be(1);
    }

    [Fact]
    public void Activity_keys_on_name()
    {
        const string json = """[ {"name":"Bronte Creek Park","category":"Park","indoor":false} ]""";

        var item = _sut.Parse(json, IngestionType.Activities).Items.Single();

        item.NaturalKey.Should().Be("bronte creek park");
    }

    [Fact]
    public void Tolerates_numbers_supplied_as_strings()
    {
        const string json = """
            [ {"name":"X","startsOn":"2026-08-15","location":"Y","driveMinutes":"42"} ]
            """;

        var item = _sut.Parse(json, IngestionType.Events).Items.Single();
        item.Payload["driveMinutes"]!.GetValue<string>().Should().Be("42");
    }

    [Theory]
    [InlineData("no array here")]
    [InlineData("")]
    [InlineData("{\"not\":\"an array\"}")]
    public void Returns_empty_when_no_array_present(string text)
    {
        var result = _sut.Parse(text, IngestionType.Events);
        result.Items.Should().BeEmpty();
        result.Considered.Should().Be(0);
    }

    [Fact]
    public void Ignores_brackets_inside_strings_when_extracting()
    {
        const string text = """[ {"name":"Art [installation]","startsOn":"2026-08-15","location":"Gallery"} ]""";
        var item = _sut.Parse(text, IngestionType.Events).Items.Single();
        item.DisplayName.Should().Be("Art [installation]");
    }
}
