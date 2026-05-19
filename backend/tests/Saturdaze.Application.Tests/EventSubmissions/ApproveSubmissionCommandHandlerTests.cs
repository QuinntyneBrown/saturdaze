// Traces to: L2-050
using FluentAssertions;
using Saturdaze.Application.EventSubmissions;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.EventSubmissions;

public class ApproveSubmissionCommandHandlerTests
{
    [Fact]
    public async Task Approve_publishes_local_event_and_sets_publishedeventid()
    {
        await using var app = TestApp.Create();
        var submission = SeedPending(app);

        var admin = new StubCurrentUserAccessor { UserId = Guid.NewGuid(), Role = UserRole.Admin };
        var handler = new ApproveSubmissionCommandHandler(app.Db, admin, new StubDateTimeProvider());

        var dto = await handler.Handle(new ApproveSubmissionCommand(submission.Id), default);

        dto.Status.Should().Be(EventSubmissionStatus.Approved);

        var stored = app.Db.EventSubmissions.Single();
        stored.PublishedEventId.Should().NotBeNull();

        app.Db.LocalEvents.Should().ContainSingle(e => e.Id == stored.PublishedEventId);
    }

    [Fact]
    public async Task Approve_is_idempotent_when_already_approved()
    {
        await using var app = TestApp.Create();
        var submission = SeedPending(app);
        var admin = new StubCurrentUserAccessor { UserId = Guid.NewGuid(), Role = UserRole.Admin };
        var handler = new ApproveSubmissionCommandHandler(app.Db, admin, new StubDateTimeProvider());

        await handler.Handle(new ApproveSubmissionCommand(submission.Id), default);
        await handler.Handle(new ApproveSubmissionCommand(submission.Id), default);

        app.Db.LocalEvents.Should().HaveCount(1);
    }

    [Fact]
    public async Task Reject_sets_reason_and_blocks_subsequent_approve()
    {
        await using var app = TestApp.Create();
        var submission = SeedPending(app);
        var admin = new StubCurrentUserAccessor { UserId = Guid.NewGuid(), Role = UserRole.Admin };

        var rejectHandler = new RejectSubmissionCommandHandler(app.Db, admin, new StubDateTimeProvider());
        var rejected = await rejectHandler.Handle(
            new RejectSubmissionCommand(submission.Id, "duplicate of seeded event"), default);

        rejected.Status.Should().Be(EventSubmissionStatus.Rejected);
        rejected.RejectionReason.Should().Be("duplicate of seeded event");

        var approveHandler = new ApproveSubmissionCommandHandler(app.Db, admin, new StubDateTimeProvider());
        var act = async () => await approveHandler.Handle(new ApproveSubmissionCommand(submission.Id), default);

        await act.Should().ThrowAsync<Saturdaze.Application.Exceptions.ConflictException>();
    }

    private static EventSubmission SeedPending(TestApp app)
    {
        var userId = Guid.NewGuid();
        app.Db.Users.Add(new User
        {
            Id = userId,
            Email = "submitter@example.com",
            NormalizedEmail = "SUBMITTER@EXAMPLE.COM",
            PasswordHash = "x",
        });
        var submission = new EventSubmission
        {
            Id = Guid.NewGuid(),
            Title = "Port Credit Buskerfest",
            StartsAtLocal = new DateTime(2026, 6, 20, 14, 0, 0),
            EndsAtLocal = new DateTime(2026, 6, 20, 21, 0, 0),
            Location = "Memorial Park",
            Category = "Festival",
            DriveMinutes = 5,
            Status = EventSubmissionStatus.Pending,
            SubmittedByUserId = userId,
            SubmittedAtUtc = new DateTimeOffset(2026, 5, 18, 12, 0, 0, TimeSpan.Zero),
        };
        app.Db.EventSubmissions.Add(submission);
        app.Db.SaveChanges();
        return submission;
    }
}
