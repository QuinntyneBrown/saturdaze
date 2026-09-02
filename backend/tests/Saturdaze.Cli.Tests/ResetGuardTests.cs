// Traces to: L2-045 #3
using FluentAssertions;
using Saturdaze.Cli.Database;
using Saturdaze.Cli.Reset;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class ResetGuardTests
{
    [Theory]
    [InlineData("Production", false, true)]
    [InlineData("production", false, true)]
    [InlineData(" Production ", false, true)]
    [InlineData("Production", true, false)]
    [InlineData("Development", false, false)]
    [InlineData("Staging", false, false)]
    [InlineData(null, false, false)]
    public void Production_is_blocked_unless_explicitly_allowed(string? environment, bool allow, bool expectedBlocked)
    {
        ResetGuard.IsProductionBlocked(environment, allow).Should().Be(expectedBlocked);
    }

    [Fact]
    public void Sanitizer_strips_credentials_and_handles_blank()
    {
        ConnectionStringSanitizer.Sanitize("Server=x;Database=y;User Id=u;Password=secret;Pwd=also")
            .Should().Be("Server=x;Database=y;User Id=u");
        ConnectionStringSanitizer.Sanitize(null).Should().Be("(provider default)");
    }
}
