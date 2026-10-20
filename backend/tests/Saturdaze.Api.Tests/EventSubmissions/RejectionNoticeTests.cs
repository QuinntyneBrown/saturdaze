// Acceptance Test
// Traces to: L2-149 AC1, AC3, AC4, AC5
// Description: A rejected suggestion reaches its submitter by email and can be dismissed only by them.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Api.Tests.EventSubmissions;

public class RejectionNoticeTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public RejectionNoticeTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Mail.Fail = false;
    }

    private async Task<(SignedInClient.Session Submitter, Guid Id, string Title)> SubmitAsync()
    {
        var submitter = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var title = $"Lakeshore Ribfest {Guid.NewGuid():N}"[..28];
        var response = await submitter.Client.PostAsJsonAsync("/api/events/submissions",
            new { Title = title, StartsAtLocal = new DateTime(2026, 7, 25, 12, 0, 0) });
        var body = await response.Content.ReadAsStringAsync();
        response.IsSuccessStatusCode.Should().BeTrue(body);
        return (submitter, JsonDocument.Parse(body).RootElement.GetProperty("id").GetGuid(), title);
    }

    private async Task RejectAsync(Guid id, string? reason)
    {
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        (await admin.Client.PostAsJsonAsync($"/api/events/submissions/{id}/reject", new { Reason = reason }))
            .EnsureSuccessStatusCode();
    }

    /// <summary>The one "not added" message; the account's verification email arrives too.</summary>
    private async Task<Saturdaze.Application.Email.EmailMessage> NoticeFor(string address)
    {
        await _factory.Mail.WaitForAsync(address, count: 2);
        return _factory.Mail.To(address).Should().ContainSingle(m => m.Subject.Contains("was not added")).Subject;
    }

    [Fact]
    public async Task A_rejection_notice_is_HTML_on_brand_and_opens_Ideas()
    {
        // Traces to: L2-162 #3
        var (submitter, id, title) = await SubmitAsync();

        await RejectAsync(id, "Looks like a <private> event & not open to every family.");

        var notice = await NoticeFor(submitter.Email);
        notice.HtmlBody.Should().NotBeNull();
        notice.HtmlBody.Should().Contain(title.Replace("&", "&amp;")).And.Contain("Open Ideas")
            .And.Contain("href=\"https://app.example.com/ideas/events\"").And.Contain("#bf5130")
            .And.Contain("Looks like a &lt;private&gt; event &amp; not open to every family.");
        notice.Body.Should().Contain("Looks like a <private> event & not open to every family.");
    }

    [Fact]
    public async Task A_rejection_emails_the_submitter_the_event_and_the_reason()
    {
        // Traces to: L2-149 AC1
        var (submitter, id, title) = await SubmitAsync();

        await RejectAsync(id, "Already listed as Port Credit Ribfest.");

        var notice = await NoticeFor(submitter.Email);
        notice.Body.Should().Contain(title).And.Contain("Already listed as Port Credit Ribfest.");
    }

    [Fact]
    public async Task A_rejection_without_a_reason_says_so()
    {
        // Traces to: L2-149 AC5
        var (submitter, id, _) = await SubmitAsync();

        await RejectAsync(id, null);

        (await NoticeFor(submitter.Email)).Body.Should().Contain("No reason was given.");
    }

    [Fact]
    public async Task The_submitter_dismisses_a_rejection_and_it_stays_dismissed()
    {
        // Traces to: L2-149 AC3
        var (submitter, id, _) = await SubmitAsync();
        await RejectAsync(id, "Duplicate.");

        var dismissed = await submitter.Client.PostAsync($"/api/events/submissions/{id}/dismiss", content: null);
        dismissed.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var mine = JsonDocument.Parse(await submitter.Client.GetStringAsync("/api/events/submissions/mine")).RootElement;
        var row = mine.EnumerateArray().Single(s => s.GetProperty("id").GetGuid() == id);
        row.GetProperty("dismissedAtUtc").ValueKind.Should().Be(JsonValueKind.String);
    }

    [Fact]
    public async Task Nobody_else_can_dismiss_a_suggestion()
    {
        // Traces to: L2-149 AC4
        var (submitter, id, _) = await SubmitAsync();
        await RejectAsync(id, "Duplicate.");
        var stranger = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        (await stranger.Client.PostAsync($"/api/events/submissions/{id}/dismiss", content: null))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);

        var mine = JsonDocument.Parse(await submitter.Client.GetStringAsync("/api/events/submissions/mine")).RootElement;
        mine.EnumerateArray().Single(s => s.GetProperty("id").GetGuid() == id)
            .GetProperty("dismissedAtUtc").ValueKind.Should().Be(JsonValueKind.Null);
    }
}
