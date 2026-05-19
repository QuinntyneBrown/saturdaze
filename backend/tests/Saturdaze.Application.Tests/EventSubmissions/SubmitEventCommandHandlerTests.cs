// Traces to: L2-046, L2-047
using FluentAssertions;
using FluentValidation;
using Saturdaze.Application.EventSubmissions;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.EventSubmissions;

public class SubmitEventCommandHandlerTests
{
    [Fact]
    public async Task Persists_submission_with_pending_status_and_submitter()
    {
        await using var app = TestApp.Create();
        var userId = Guid.NewGuid();
        app.Db.Users.Add(new User
        {
            Id = userId,
            Email = "quinn@example.com",
            NormalizedEmail = "QUINN@EXAMPLE.COM",
            PasswordHash = "x",
        });
        await app.Db.SaveChangesAsync();

        var current = new StubCurrentUserAccessor { UserId = userId };
        var clock = new StubDateTimeProvider();
        var handler = new SubmitEventCommandHandler(app.Db, current, clock);

        var cmd = new SubmitEventCommand(
            Title: "Port Credit Buskerfest",
            StartsAtLocal: new DateTime(2026, 6, 20, 14, 0, 0));

        var dto = await handler.Handle(cmd, default);

        dto.Status.Should().Be(EventSubmissionStatus.Pending);
        dto.Title.Should().Be("Port Credit Buskerfest");
        dto.SubmittedByUserId.Should().Be(userId);
        dto.SubmittedByEmail.Should().Be("quinn@example.com");

        var row = app.Db.EventSubmissions.Single();
        row.Status.Should().Be(EventSubmissionStatus.Pending);
        row.SubmittedByUserId.Should().Be(userId);
        row.SubmittedAtUtc.Should().Be(clock.UtcNow);
    }

    [Fact]
    public void Validator_requires_title()
    {
        var validator = new SubmitEventCommandValidator();
        var result = validator.Validate(new SubmitEventCommand(
            Title: string.Empty,
            StartsAtLocal: new DateTime(2026, 6, 20, 14, 0, 0)));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(SubmitEventCommand.Title));
    }

    [Fact]
    public void Validator_rejects_non_http_url()
    {
        var validator = new SubmitEventCommandValidator();
        var result = validator.Validate(new SubmitEventCommand(
            Title: "T",
            StartsAtLocal: new DateTime(2026, 6, 20, 14, 0, 0),
            SourceUrl: "javascript:alert(1)"));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorCode == "invalid_url");
    }

    [Fact]
    public void Validator_accepts_https_url()
    {
        var validator = new SubmitEventCommandValidator();
        var result = validator.Validate(new SubmitEventCommand(
            Title: "T",
            StartsAtLocal: new DateTime(2026, 6, 20, 14, 0, 0),
            SourceUrl: "https://portcredit.com/buskerfest"));

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validator_accepts_no_url()
    {
        var validator = new SubmitEventCommandValidator();
        var result = validator.Validate(new SubmitEventCommand(
            Title: "T",
            StartsAtLocal: new DateTime(2026, 6, 20, 14, 0, 0)));

        result.IsValid.Should().BeTrue();
    }
}
