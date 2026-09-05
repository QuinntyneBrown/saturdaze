using FluentAssertions;
using Saturdaze.Application.Ingestion;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Ingestion;

public class IngestionPromptsAndTypesTests
{
    private static readonly IngestionContext Ctx =
        new("Port Credit, Mississauga, ON", 200, new DateOnly(2026, 5, 30));

    [Fact]
    public void Event_prompt_substitutes_context_and_demands_the_schema()
    {
        var prompt = IngestionPrompts.BuildSystemPrompt(IngestionType.Events, Ctx);

        prompt.Should().Contain("Port Credit, Mississauga, ON");
        prompt.Should().Contain("200 minutes");
        prompt.Should().Contain("2026-05-30");           // this weekend
        prompt.Should().Contain("2026-06-06");           // following weekend
        prompt.Should().Contain("\"startsOn\": \"YYYY-MM-DD\"");
        prompt.Should().Contain("web_search");
    }

    [Fact]
    public void Restaurant_prompt_names_the_meal_slots()
    {
        var prompt = IngestionPrompts.BuildSystemPrompt(IngestionType.Restaurants, Ctx);
        prompt.Should().Contain("\"Lunch\"|\"Dinner\"");
        prompt.Should().Contain("wifeApproved");
    }

    [Fact]
    public void User_prompt_includes_home_location()
    {
        IngestionPrompts.BuildUserPrompt(IngestionType.Activities, Ctx)
            .Should().Contain("Port Credit, Mississauga, ON");
    }

    [Fact]
    public void Types_parse_all_and_blank_to_every_type()
    {
        IngestionTypes.Parse("all").Should().Equal(IngestionTypes.All);
        IngestionTypes.Parse(null).Should().Equal(IngestionTypes.All);
        IngestionTypes.Parse("  ").Should().Equal(IngestionTypes.All);
    }

    [Fact]
    public void Types_parse_a_csv_list_in_canonical_order()
    {
        IngestionTypes.Parse("restaurants,events")
            .Should().Equal(IngestionType.Events, IngestionType.Restaurants);
    }

    [Fact]
    public void Types_parse_is_case_insensitive_and_tolerates_singular()
    {
        IngestionTypes.Parse("Activity").Should().Equal(IngestionType.Activities);
    }

    [Fact]
    public void Types_parse_rejects_unknown_tokens()
    {
        var act = () => IngestionTypes.Parse("weather");
        act.Should().Throw<ArgumentException>().WithMessage("*weather*");
    }
}
