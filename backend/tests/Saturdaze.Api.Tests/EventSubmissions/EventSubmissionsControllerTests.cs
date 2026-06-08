// Traces to: L2-046, L2-049, L2-050
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.EventSubmissions;

public class EventSubmissionsControllerTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    public EventSubmissionsControllerTests(SaturdazeApiFactory factory) => _factory = factory;

    private record RegisterRequest(string Email, string Password, string? FamilyName, string? HomeLocation);
    private record TokenDto(string AccessToken, string RefreshToken, DateTimeOffset AccessTokenExpiresAtUtc, string TokenType);
    private record UserDto(Guid Id, string Email, string Role, DateTimeOffset? EmailVerifiedUtc);
    private record AuthSuccessDto(TokenDto Token, UserDto User);
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
    public async Task Submit_returns_201_with_pending_status_and_hides_from_public_feed()
    {
        // Traces to: L2-046 #1
        var (client, _) = await NewSignedInClientAsync();

        var res = await client.PostAsJsonAsync("/api/events/submissions",
            new SubmitRequest("Port Credit Buskerfest", new DateTime(2026, 6, 20, 14, 0, 0)));

        res.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement;
        body.GetProperty("status").GetString().Should().Be("Pending");

        // The public feed must not contain a pending submission.
        var publicClient = _factory.CreateClient();
        var publicFeed = await publicClient.GetAsync("/api/events?weekendOf=2026-06-20");
        publicFeed.EnsureSuccessStatusCode();
        var events = JsonDocument.Parse(await publicFeed.Content.ReadAsStringAsync()).RootElement
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
        var (client, _) = await NewSignedInClientAsync();
        var res = await client.PostAsJsonAsync("/api/events/submissions",
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
        var (aliceClient, aliceEmail) = await NewSignedInClientAsync();
        await aliceClient.PostAsJsonAsync("/api/events/submissions",
            new SubmitRequest("Alice's event", new DateTime(2026, 6, 27, 10, 0, 0)));

        var (bobClient, _) = await NewSignedInClientAsync();
        await bobClient.PostAsJsonAsync("/api/events/submissions",
            new SubmitRequest("Bob's event", new DateTime(2026, 7, 4, 10, 0, 0)));

        var alicesView = await aliceClient.GetAsync("/api/events/submissions/mine");
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
        var (client, _) = await NewSignedInClientAsync();
        var res = await client.GetAsync("/api/events/submissions/pending");
        res.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Admin_approves_submission_and_event_appears_in_public_feed()
    {
        // Traces to: L2-050 #1
        var (submitter, _) = await NewSignedInClientAsync();
        var submitRes = await submitter.PostAsJsonAsync("/api/events/submissions",
            new SubmitRequest(
                $"Buskerfest-{Guid.NewGuid():N}",
                new DateTime(2026, 7, 11, 14, 0, 0),
                Location: "Memorial Park",
                Category: "Festival"));
        submitRes.EnsureSuccessStatusCode();
        var submission = JsonDocument.Parse(await submitRes.Content.ReadAsStringAsync()).RootElement;
        var submissionId = submission.GetProperty("id").GetGuid();
        var submittedTitle = submission.GetProperty("title").GetString()!;

        var (adminClient, _) = await NewAdminClientAsync();
        var approve = await adminClient.PostAsync($"/api/events/submissions/{submissionId}/approve", content: null);
        approve.StatusCode.Should().Be(HttpStatusCode.OK);

        var publicFeed = await _factory.CreateClient().GetAsync("/api/events?weekendOf=2026-07-11");
        publicFeed.EnsureSuccessStatusCode();
        var titles = JsonDocument.Parse(await publicFeed.Content.ReadAsStringAsync()).RootElement
            .EnumerateArray()
            .Select(e => e.GetProperty("name").GetString())
            .ToArray();
        titles.Should().Contain(submittedTitle);
    }

    [Fact]
    public async Task Admin_rejects_submission_with_reason()
    {
        // Traces to: L2-050 #2
        var (submitter, _) = await NewSignedInClientAsync();
        var submitRes = await submitter.PostAsJsonAsync("/api/events/submissions",
            new SubmitRequest("To be rejected", new DateTime(2026, 7, 25, 14, 0, 0)));
        var submissionId = JsonDocument.Parse(await submitRes.Content.ReadAsStringAsync()).RootElement
            .GetProperty("id").GetGuid();

        var (adminClient, _) = await NewAdminClientAsync();
        var reject = await adminClient.PostAsJsonAsync(
            $"/api/events/submissions/{submissionId}/reject",
            new RejectRequest("duplicate of seeded event"));
        reject.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = JsonDocument.Parse(await reject.Content.ReadAsStringAsync()).RootElement;
        body.GetProperty("status").GetString().Should().Be("Rejected");
        body.GetProperty("rejectionReason").GetString().Should().Be("duplicate of seeded event");
    }

    private async Task<(HttpClient client, string email)> NewSignedInClientAsync()
    {
        var client = _factory.CreateClient();
        var email = $"sub-{Guid.NewGuid():N}@example.com";
        var reg = await client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "password123", null, null));
        reg.EnsureSuccessStatusCode();
        var body = await reg.Content.ReadFromJsonAsync<AuthSuccessDto>();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body!.Token.AccessToken);
        return (client, email);
    }

    private async Task<(HttpClient client, string email)> NewAdminClientAsync()
    {
        var (client, email) = await NewSignedInClientAsync();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.SingleAsync(u => u.Email == email);
            user.Role = UserRole.Admin;
            await db.SaveChangesAsync();
        }

        // Re-login to pick up the new role claim in the token.
        var login = await _factory.CreateClient().PostAsJsonAsync("/api/auth/login",
            new { Email = email, Password = "password123" });
        login.EnsureSuccessStatusCode();
        var body = await login.Content.ReadFromJsonAsync<AuthSuccessDto>();

        var adminClient = _factory.CreateClient();
        adminClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", body!.Token.AccessToken);
        return (adminClient, email);
    }
}
