// Acceptance Test
// Traces to: L2-203 (scheduled trigger), L2-213
// Description: saturdaze draft-weekends is the command the draft WebJob runs.

using System.CommandLine;
using FluentAssertions;
using Saturdaze.Application.AgentPlanning;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class DraftWeekendsCommandTests
{
    [Fact]
    public void Draft_weekends_answers_help_and_explains_itself()
    {
        var root = RootCommandFactory.Create(new[] { "draft-weekends", "--help" });

        root.Invoke(new[] { "draft-weekends", "--help" }).Should().Be(0);
        root.Subcommands.Single(c => c.Name == "draft-weekends").Description.Should().Contain("agents");
    }

    [Fact]
    public void A_run_that_errored_makes_the_job_exit_1_and_a_fallback_for_other_reasons_does_not()
    {
        AgentRun Run(AgentFallbackReason? reason) => new() { Status = reason is null ? AgentRunStatus.Applied : AgentRunStatus.FellBack, FallbackReason = reason };

        ScheduledDrafts.ExitCodeFor(new[] { Run(null), Run(AgentFallbackReason.Error) }).Should().Be(1);
        ScheduledDrafts.ExitCodeFor(new[] { Run(null), Run(AgentFallbackReason.Invalid), Run(AgentFallbackReason.Disabled) }).Should().Be(0);
    }
}
