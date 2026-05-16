using FluentAssertions;
using FluentValidation.TestHelper;
using Saturdaze.Application.Families;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Families;

public class SaveFamilyProfileCommandValidatorTests
{
    private readonly SaveFamilyProfileCommandValidator _v = new();

    private static SaveFamilyProfileCommand Valid() => new(
        HomeLocation: "Port Credit",
        BudgetEnabled: false,
        Members: new[] { new SaveMemberInput("Quinn", 41), new SaveMemberInput("Theo", 9) },
        Commitments: new[]
        {
            new SaveCommitmentInput("Swim", DayOfWeek.Saturday, new TimeOnly(9, 30), new TimeOnly(10, 30))
        },
        Preferences: new[] { new SavePreferenceInput(PreferenceKind.Like, "outdoors") });

    [Fact]
    public void Valid_command_passes()
    {
        _v.TestValidate(Valid()).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Empty_home_location_fails()
    {
        var cmd = Valid() with { HomeLocation = "" };
        _v.TestValidate(cmd).ShouldHaveValidationErrorFor(x => x.HomeLocation);
    }

    [Fact]
    public void Member_age_outside_bounds_fails()
    {
        var cmd = Valid() with { Members = new[] { new SaveMemberInput("X", -1) } };
        _v.TestValidate(cmd).ShouldHaveValidationErrorFor("Members[0].Age");
    }

    [Fact]
    public void Duplicate_member_names_fail()
    {
        var cmd = Valid() with { Members = new[] { new SaveMemberInput("Theo", 9), new SaveMemberInput("theo", 9) } };
        _v.TestValidate(cmd).ShouldHaveValidationErrorFor(x => x.Members);
    }

    [Fact]
    public void Commitment_with_start_after_end_fails()
    {
        var cmd = Valid() with
        {
            Commitments = new[]
            {
                new SaveCommitmentInput("Bad", DayOfWeek.Saturday, new TimeOnly(11, 0), new TimeOnly(10, 0))
            }
        };
        _v.TestValidate(cmd).ShouldHaveValidationErrorFor("Commitments[0].StartTime");
    }

    [Fact]
    public void Overlapping_commitments_same_day_fails()
    {
        var cmd = Valid() with
        {
            Commitments = new[]
            {
                new SaveCommitmentInput("A", DayOfWeek.Saturday, new TimeOnly(9, 0),  new TimeOnly(10, 0)),
                new SaveCommitmentInput("B", DayOfWeek.Saturday, new TimeOnly(9, 30), new TimeOnly(10, 30))
            }
        };
        _v.TestValidate(cmd).ShouldHaveValidationErrorFor(x => x.Commitments);
    }

    [Fact]
    public void Non_overlapping_commitments_across_days_pass()
    {
        var cmd = Valid() with
        {
            Commitments = new[]
            {
                new SaveCommitmentInput("Sat", DayOfWeek.Saturday, new TimeOnly(9, 0),  new TimeOnly(10, 0)),
                new SaveCommitmentInput("Sun", DayOfWeek.Sunday,   new TimeOnly(9, 30), new TimeOnly(10, 30))
            }
        };
        _v.TestValidate(cmd).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Duplicate_preferences_fail()
    {
        var cmd = Valid() with
        {
            Preferences = new[]
            {
                new SavePreferenceInput(PreferenceKind.Like, "Outdoors"),
                new SavePreferenceInput(PreferenceKind.Like, "outdoors")
            }
        };
        _v.TestValidate(cmd).ShouldHaveValidationErrorFor(x => x.Preferences);
    }
}
