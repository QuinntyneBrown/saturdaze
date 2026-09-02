// Traces to: L2-046, L2-049, L2-050
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Api.Tests.EventSubmissions;

public class EventSubmissionsControllerTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    public EventSubmissionsControllerTests(SaturdazeApiFactory factory) => _factory = factory;

    private record SubmitRequest(
        string Title,
        DateTime StartsAtLocal,
        DateTime? EndsAtLocal = null,
        string? Location = null,
        string? Description = null,
        string? CostNote = null,
        string? AgeRange = null,
        string? SourceUrl = null,
        string? Category = null);
    private record RejectRequest(string? Reason);

    [Fact]
    public async Task Submit_returns_201_with_pending_status_and_hides_from_approved_feed()
    {
        // Traces to: L2-046 #1
        var submitter = await SignedInClient.CreateAsync(_factory);

        var res = await submitter.Client.PostAsJsonAsync("/api/events/submissions",
            new SubmitRequest("Port Credit Buskerfest", new DateTime(2026, 6, 20, 14, 0, 0)));

        res.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement;
        body.GetProperty("status").GetString().Should().Be("Pending");

        // The approved feed must not contain a pending submission — not even for another signed-in family.
        var other = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var feed = await other.Client.GetAsync("/api/events?weekendOf=2026-06-20");
        feed.EnsureSuccessStatusCode();
        var events = JsonDocument.Parse(await feed.Content.ReadAsStringAsync()).RootElement
            .EnumerateArray()
            .Select(e => e.GetProperty("name").GetString())
            .ToArray();
        events.Should().NotContain("Port Credit Buskerfest");
    }

    [Fact]
    public async Task Submit_without_auth_returns_401()
    {
        // Traces to: L2-046 #2
        var client = _factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/events/submissions",
            new SubmitRequest("anything", new DateTime(2026, 6, 20, 14, 0, 0)));

        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Submit_with_invalid_url_returns_400()
    {
        // Traces to: L2-046 #4
        var submitter = await SignedInClient.CreateAsync(_factory);
        var res = await submitter.Client.PostAsJsonAsync("/api/events/submissions",
            new SubmitRequest(
                "Buskerfest",
                new DateTime(2026, 6, 20, 14, 0, 0),
                SourceUrl: "javascript:alert(1)"));

        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Mine_returns_own_submissions_only()
    {
        // Traces to: L2-049 #1, #2
        var alice = await SignedInClient.CreateAsync(_factory);
        await alice.Client.PostAsJsonAsync("/api/events/submissions",
            new SubmitRequest("Alice's event", new DateTime(2026, 6, 27, 10, 0, 0)));

        var bob = await SignedInClient.CreateAsync(_factory);
        await bob.Client.PostAsJsonAsync("/api/events/submissions",
            new SubmitRequest("Bob's event", new DateTime(2026, 7, 4, 10, 0, 0)));

        var alicesView = await alice.Client.GetAsync("/api/events/submissions/mine");
        alicesView.EnsureSuccessStatusCode();
        var titles = JsonDocument.Parse(await alicesView.Content.ReadAsStringAsync()).RootElement
            .EnumerateArray()
            .Select(e => e.GetProperty("title").GetString())
            .ToArray();
        titles.Should().Contain("Alice's event");
        titles.Should().NotContain("Bob's event");
    }

    [Fact]
    public async Task Non_admin_cannot_list_pending_or_moderate()
    {
        // Traces to: L2-050 #3
        var user = await SignedInClient.CreateAsync(_factory);
        var res = await user.Client.GetAsync("/api/events/submissions/pending");
        res.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Admin_approves_submission_and_event_appears_in_approved_feed()
    {
        // Traces to: L2-050 #1
        var submitter = await SignedInClient.CreateAsync(_factory);
        var submitRes = await submitter.Client.PostAsJsonAsync("/api/events/submissions",
            new SubmitRequest(
                $"Buskerfest-{Guid.NewGuid():N}",
                new DateTime(2026, 7, 11, 14, 0, 0),
                Location: "Memorial Park",
                Category: "Festival"));
        submitRes.EnsureSuccessStatusCode();
        var submission = JsonDocument.Parse(await submitRes.Content.ReadAsStringAsync()).RootElement;
        var submissionId = submission.GetProperty("id").GetGuid();
        var submittedTitle = submission.GetProperty("title").GetString()!;

        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var approve = await admin.Client.PostAsync($"/api/events/submissions/{submissionId}/approve", content: null);
        approve.StatusCode.Should().Be(HttpStatusCode.OK);

        var feed = await submitter.Client.GetAsync("/api/events?weekendOf=2026-07-11");
        feed.EnsureSuccessStatusCode();
        var titles = JsonDocument.Parse(await feed.Content.ReadAsStringAsync()).RootElement
            .EnumerateArray()
            .Select(e => e.GetProperty("name").GetString())
            .ToArray();
        titles.Should().Contain(submittedTitle);
    }

    [Fact]
    public async Task Admin_can_set_drive_minutes_on_approval_and_duplicates_are_409()
    {
        // Traces to: ADR-006 (drive minutes set at approval)
        var submitter = await SignedInClient.CreateAsync(_factory);
        var title = $"Drive-{Guid.NewGuid():N}";
        var first = await submitter.Client.PostAsJsonAsync("/api/events/submissions",
            new SubmitRequest(title, new DateTime(2026, 8, 1, 10, 0, 0), Category: "Fair"));
        first.EnsureSuccessStatusCode();
        var firstId = JsonDocument.Parse(await first.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        var second = await submitter.Client.PostAsJsonAsync("/api/events/submissions",
            new SubmitRequest(title, new DateTime(2026, 8, 1, 12, 0, 0), Category: "Fair"));
        second.EnsureSuccessStatusCode();
        var secondId = JsonDocument.Parse(await second.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var approve = await admin.Client.PostAsJsonAsync($"/api/events/submissions/{firstId}/approve", new { DriveMinutes = 25 });
        approve.StatusCode.Should().Be(HttpStatusCode.OK, await approve.Content.ReadAsStringAsync());

        var published = JsonDocument.Parse(await (await submitter.Client.GetAsync("/api/events?weekendOf=2026-08-01")).Content.ReadAsStringAsync())
            .RootElement.EnumerateArray().Single(e => e.GetProperty("name").GetString() == title);
        published.GetProperty("driveMinutes").GetInt32().Should().Be(25);

        var duplicate = await admin.Client.PostAsync($"/api/events/submissions/{secondId}/approve", content: null);
        duplicate.StatusCode.Should().Be(HttpStatusCode.Conflict);
        JsonDocument.Parse(await duplicate.Content.ReadAsStringAsync()).RootElement
            .GetProperty("code").GetString().Should().Be("event_already_published");
    }

    [Fact]
    public async Task Admin_rejects_submission_with_reason()
    {
        // Traces to: L2-050 #2
        var submitter = await SignedInClient.CreateAsync(_factory);
        var submitRes = await submitter.Client.PostAsJsonAsync("/api/events/submissions",
            new SubmitRequest("To be rejected", new DateTime(2026, 7, 25, 14, 0, 0)));
        var submissionId = JsonDocument.Parse(await submitRes.Content.ReadAsStringAsync()).RootElement
            .GetProperty("id").GetGuid();

        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var reject = await admin.Client.PostAsJsonAsync(
            $"/api/events/submissions/{submissionId}/reject",
            new RejectRequest("duplicate of seeded event"));
        reject.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = JsonDocument.Parse(await reject.Content.ReadAsStringAsync()).RootElement;
        body.GetProperty("status").GetString().Should().Be("Rejected");
        body.GetProperty("rejectionReason").GetString().Should().Be("duplicate of seeded event");
    }
}
