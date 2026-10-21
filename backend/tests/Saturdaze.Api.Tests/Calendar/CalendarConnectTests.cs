// Acceptance Test
// Traces to: L2-173 AC1-AC8, L2-175 AC1, AC2, AC4, AC5, L2-181 AC1, AC3, AC5
// Description: A family member connects the primary calendar of a Google account and disconnects it again.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Calendar;

public class CalendarConnectTests : IClassFixture<SaturdazeApiFactory>, IDisposable
{
    private readonly SaturdazeApiFactory _factory;

    public CalendarConnectTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Clock.Today = new DateOnly(2026, 5, 14);
        _factory.Clock.TimeOfDay = TimeSpan.FromHours(9);
        _factory.GoogleCalendar.IsConfigured = true;
        _factory.GoogleCalendar.Unavailable = false;
        _factory.GoogleCalendar.RevokeFails = false;
    }

    public void Dispose()
    {
        _factory.Clock.TimeOfDay = TimeSpan.FromHours(9);
        _factory.GoogleCalendar.IsConfigured = true;
        _factory.GoogleCalendar.Unavailable = false;
        _factory.GoogleCalendar.RevokeFails = false;
    }

    private static async Task<JsonElement> Read(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        response.IsSuccessStatusCode.Should().BeTrue(body);
        return body.Length == 0 ? default : JsonDocument.Parse(body).RootElement.Clone();
    }

    private static async Task<string> AuthorizeAsync(HttpClient client)
    {
        var response = await Read(await client.PostAsync("/api/calendar/google/authorize", content: null));
        var url = new Uri(response.GetProperty("authorizationUrl").GetString()!);
        return QueryHelpers.ParseQuery(url.Query)["state"].ToString();
    }

    private static Task<HttpResponseMessage> ConnectAsync(HttpClient client, string code, string state)
        => client.PostAsJsonAsync("/api/calendar/google/connect", new { Code = code, State = state });

    private async Task<JsonElement> ConnectedAsync(HttpClient client, string email)
    {
        var state = await AuthorizeAsync(client);
        return await Read(await ConnectAsync(client, _factory.GoogleCalendar.IssueCode(email), state));
    }

    private static async Task<JsonElement> SettingsAsync(HttpClient client)
        => await Read(await client.GetAsync("/api/calendar"));

    private static async Task<string> CodeOf(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(body).RootElement.GetProperty("code").GetString()!;
    }

    [Fact]
    public async Task Authorize_returns_googles_consent_url_with_offline_access_and_only_the_calendar_events_scope()
    {
        // Traces to: L2-173 AC1
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var body = await Read(await session.Client.PostAsync("/api/calendar/google/authorize", content: null));

        var url = new Uri(body.GetProperty("authorizationUrl").GetString()!);
        url.GetLeftPart(UriPartial.Path).Should().Be("https://accounts.google.com/o/oauth2/v2/auth");
        var query = QueryHelpers.ParseQuery(url.Query);
        query["client_id"].ToString().Should().Be(FakeGoogleCalendarClient.ClientId);
        query["response_type"].ToString().Should().Be("code");
        query["access_type"].ToString().Should().Be("offline");
        query["prompt"].ToString().Should().Be("consent");
        query["redirect_uri"].ToString().Should().Be("https://app.example.com/family/calendar/google");
        query["scope"].ToString().Should().Be("openid email https://www.googleapis.com/auth/calendar.events");
        query["state"].ToString().Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Connecting_stores_the_grant_encrypted_and_reports_the_connection()
    {
        // Traces to: L2-173 AC2, L2-181 AC3
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var state = await AuthorizeAsync(session.Client);
        var code = _factory.GoogleCalendar.IssueCode("cal@example.com");
        var refreshToken = _factory.GoogleCalendar.RefreshTokenFor(code);

        var response = await ConnectAsync(session.Client, code, state);

        var body = await Read(response);
        var google = body.GetProperty("google");
        google.GetProperty("email").GetString().Should().Be("cal@example.com");
        google.GetProperty("status").GetString().Should().Be("connected");
        google.GetProperty("readCommitments").GetBoolean().Should().BeTrue();
        body.GetRawText().Should().NotContain(refreshToken);
        _factory.GoogleCalendar.ExchangedWith.Should().Contain("https://app.example.com/family/calendar/google");

        (await SettingsAsync(session.Client)).GetRawText().Should().NotContain(refreshToken);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var stored = await db.CalendarConnections.SingleAsync(c => c.UserId == session.UserId);
        stored.ProtectedRefreshToken.Should().NotBeNullOrEmpty().And.NotContain(refreshToken);
    }

    [Fact]
    public async Task A_state_from_another_member_an_old_state_or_a_tampered_state_is_refused()
    {
        // Traces to: L2-173 AC3
        var first = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var second = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var firstState = await AuthorizeAsync(first.Client);

        var stolen = await ConnectAsync(second.Client, _factory.GoogleCalendar.IssueCode("x@example.com"), firstState);
        stolen.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await CodeOf(stolen)).Should().Be("calendar_state_invalid");

        var tampered = await ConnectAsync(first.Client, _factory.GoogleCalendar.IssueCode("x@example.com"), firstState[..^4] + "AAAA");
        tampered.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await CodeOf(tampered)).Should().Be("calendar_state_invalid");

        _factory.Clock.TimeOfDay += TimeSpan.FromMinutes(11);
        var old = await ConnectAsync(first.Client, _factory.GoogleCalendar.IssueCode("x@example.com"), firstState);
        old.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await CodeOf(old)).Should().Be("calendar_state_invalid");

        (await SettingsAsync(first.Client)).GetProperty("google").ValueKind.Should().Be(JsonValueKind.Null);
        (await SettingsAsync(second.Client)).GetProperty("google").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task A_refused_code_a_grant_without_the_calendar_scope_and_an_outage_store_nothing()
    {
        // Traces to: L2-173 AC4
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var refused = await ConnectAsync(session.Client, "not-a-code-google-issued", await AuthorizeAsync(session.Client));
        refused.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await CodeOf(refused)).Should().Be("google_calendar_code_invalid");

        var noScopeCode = _factory.GoogleCalendar.IssueCode("cal@example.com", calendarScope: false);
        var noScopeToken = _factory.GoogleCalendar.RefreshTokenFor(noScopeCode);
        var noScope = await ConnectAsync(session.Client, noScopeCode, await AuthorizeAsync(session.Client));
        noScope.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await CodeOf(noScope)).Should().Be("google_calendar_scope_missing");
        _factory.GoogleCalendar.Revoked.Should().Contain(noScopeToken);

        var state = await AuthorizeAsync(session.Client);
        _factory.GoogleCalendar.Unavailable = true;
        var outage = await ConnectAsync(session.Client, _factory.GoogleCalendar.IssueCode("cal@example.com"), state);
        outage.StatusCode.Should().Be(HttpStatusCode.BadGateway);
        (await CodeOf(outage)).Should().Be("google_calendar_unavailable");
        _factory.GoogleCalendar.Unavailable = false;

        (await SettingsAsync(session.Client)).GetProperty("google").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task Without_a_client_secret_the_calendar_endpoints_answer_not_configured()
    {
        // Traces to: L2-173 AC5
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        _factory.GoogleCalendar.IsConfigured = false;

        var authorize = await session.Client.PostAsync("/api/calendar/google/authorize", content: null);
        authorize.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        (await CodeOf(authorize)).Should().Be("google_calendar_not_configured");
        var connect = await ConnectAsync(session.Client, "any", "any");
        connect.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        (await CodeOf(connect)).Should().Be("google_calendar_not_configured");

        (await SettingsAsync(session.Client)).GetProperty("googleConfigured").GetBoolean().Should().BeFalse();
        _factory.GoogleCalendar.IsConfigured = true;
        (await SettingsAsync(session.Client)).GetProperty("googleConfigured").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task Connecting_again_revokes_the_earlier_grant_and_names_the_new_account()
    {
        // Traces to: L2-173 AC6
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var firstCode = _factory.GoogleCalendar.IssueCode("first@example.com");
        var firstToken = _factory.GoogleCalendar.RefreshTokenFor(firstCode);
        await Read(await ConnectAsync(session.Client, firstCode, await AuthorizeAsync(session.Client)));

        var body = await ConnectedAsync(session.Client, "second@example.com");

        body.GetProperty("google").GetProperty("email").GetString().Should().Be("second@example.com");
        _factory.GoogleCalendar.Revoked.Should().Contain(firstToken);
    }

    [Fact]
    public async Task The_calendar_account_may_differ_from_the_google_sign_in_account()
    {
        // Traces to: L2-173 AC7
        var signIn = _factory.Google.Issue("sign-in-sub-" + Guid.NewGuid().ToString("N"), $"a-{Guid.NewGuid():N}@gmail.com");
        var login = await Read(await _factory.CreateClient().PostAsJsonAsync("/api/auth/google", new { Credential = signIn }));
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", login.GetProperty("token").GetProperty("accessToken").GetString());
        var userId = login.GetProperty("user").GetProperty("id").GetGuid();
        string? subjectBefore;
        using (var scope = _factory.Services.CreateScope())
            subjectBefore = (await scope.ServiceProvider.GetRequiredService<AppDbContext>().Users.SingleAsync(u => u.Id == userId)).GoogleSubject;

        var body = await ConnectedAsync(client, "b@gmail.com");

        body.GetProperty("google").GetProperty("email").GetString().Should().Be("b@gmail.com");
        using var after = _factory.Services.CreateScope();
        (await after.ServiceProvider.GetRequiredService<AppDbContext>().Users.SingleAsync(u => u.Id == userId))
            .GoogleSubject.Should().Be(subjectBefore);
    }

    [Fact]
    public async Task The_calendar_endpoints_need_a_bearer()
    {
        // Traces to: L2-173 AC8
        var anonymous = _factory.CreateClient();
        (await anonymous.PostAsync("/api/calendar/google/authorize", content: null)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await anonymous.PostAsJsonAsync("/api/calendar/google/connect", new { Code = "c", State = "s" })).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await anonymous.PutAsJsonAsync("/api/calendar/google", new { ReadCommitments = false })).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await anonymous.DeleteAsync("/api/calendar/google")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task The_plan_around_my_calendar_switch_saves()
    {
        // Traces to: L2-174 AC6 (API)
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        await ConnectedAsync(session.Client, "cal@example.com");

        var body = await Read(await session.Client.PutAsJsonAsync("/api/calendar/google", new { ReadCommitments = false }));

        body.GetProperty("google").GetProperty("readCommitments").GetBoolean().Should().BeFalse();
        (await SettingsAsync(session.Client)).GetProperty("google").GetProperty("readCommitments").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task Disconnecting_revokes_the_grant_and_forgets_the_connection()
    {
        // Traces to: L2-175 AC1
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var code = _factory.GoogleCalendar.IssueCode("cal@example.com");
        var token = _factory.GoogleCalendar.RefreshTokenFor(code);
        await Read(await ConnectAsync(session.Client, code, await AuthorizeAsync(session.Client)));

        var response = await session.Client.DeleteAsync("/api/calendar/google");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        _factory.GoogleCalendar.Revoked.Should().Contain(token);
        (await SettingsAsync(session.Client)).GetProperty("google").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task Disconnecting_still_forgets_the_connection_when_google_cannot_revoke()
    {
        // Traces to: L2-175 AC2
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        await ConnectedAsync(session.Client, "cal@example.com");
        _factory.GoogleCalendar.RevokeFails = true;

        (await session.Client.DeleteAsync("/api/calendar/google")).StatusCode.Should().Be(HttpStatusCode.NoContent);

        (await SettingsAsync(session.Client)).GetProperty("google").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task Each_member_sees_and_disconnects_only_their_own_connection()
    {
        // Traces to: L2-175 AC4, L2-181 AC1
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var member = await SignedInClient.JoinAsync(_factory, owner.FamilyId!.Value);
        await ConnectedAsync(owner.Client, "owner@example.com");

        (await SettingsAsync(member.Client)).GetProperty("google").ValueKind.Should().Be(JsonValueKind.Null);
        (await member.Client.DeleteAsync("/api/calendar/google")).StatusCode.Should().Be(HttpStatusCode.NoContent);

        var ownerSettings = await SettingsAsync(owner.Client);
        ownerSettings.GetProperty("google").GetProperty("status").GetString().Should().Be("connected");
    }

    [Fact]
    public async Task Disconnecting_without_a_connection_is_fine()
    {
        // Traces to: L2-175 AC5
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        (await session.Client.DeleteAsync("/api/calendar/google")).StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task A_removed_member_loses_their_connection()
    {
        // Traces to: L2-181 AC5
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var member = await SignedInClient.JoinAsync(_factory, owner.FamilyId!.Value);
        await ConnectedAsync(member.Client, "member@example.com");
        Guid memberId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var row = new Saturdaze.Domain.Entities.FamilyMember
            {
                Id = Guid.NewGuid(), FamilyId = owner.FamilyId!.Value, Name = "Sara", Age = 36, UserId = member.UserId,
            };
            db.FamilyMembers.Add(row);
            await db.SaveChangesAsync();
            memberId = row.Id;
        }

        (await owner.Client.DeleteAsync($"/api/family/members/{memberId}")).IsSuccessStatusCode.Should().BeTrue();

        using var after = _factory.Services.CreateScope();
        (await after.ServiceProvider.GetRequiredService<AppDbContext>().CalendarConnections
            .AnyAsync(c => c.UserId == member.UserId)).Should().BeFalse();
    }
}
