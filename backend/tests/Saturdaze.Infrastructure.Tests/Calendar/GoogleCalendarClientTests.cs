// Acceptance Test
// Traces to: L2-172 AC1, AC2, AC4, L2-174 AC1, L2-177
// Description: The Google client builds the consent URL, exchanges codes and revokes grants against Google's
// endpoints, and maps Google's errors, without the network (ADR-020, decision 7).

using System.Net;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Calendar;
using Saturdaze.Infrastructure.Authentication;
using Saturdaze.Infrastructure.Calendar;
using Xunit;

namespace Saturdaze.Infrastructure.Tests.Calendar;

public class GoogleCalendarClientTests
{
    private const string Redirect = "https://app.example.com/family/calendar/google";
    private readonly FakeGoogle _google = new();

    private GoogleCalendarClient Client(string clientId = "client-id", string secret = "client-secret")
        => new(new SingleClientFactory(_google), new MemoryCache(new MemoryCacheOptions()),
            Options.Create(new GoogleOptions { ClientId = clientId, ClientSecret = secret }));

    private static string IdToken(string sub, string email)
    {
        static string B64(string s) => Convert.ToBase64String(Encoding.UTF8.GetBytes(s)).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        return $"{B64("{\"alg\":\"RS256\"}")}.{B64(JsonSerializer.Serialize(new { sub, email }))}.sig";
    }

    [Fact]
    public void It_is_configured_only_with_both_the_client_id_and_the_secret()
    {
        Client().IsConfigured.Should().BeTrue();
        Client(secret: "").IsConfigured.Should().BeFalse();
        Client(clientId: "").IsConfigured.Should().BeFalse();
    }

    [Fact]
    public void The_consent_url_asks_for_offline_access_to_calendar_events_only()
    {
        var url = Client().AuthorizationUrl("st", Redirect).AbsoluteUri;
        url.Should().StartWith("https://accounts.google.com/o/oauth2/v2/auth?");
        url.Should().Contain("client_id=client-id").And.Contain("access_type=offline").And.Contain("prompt=consent")
            .And.Contain("response_type=code").And.Contain("state=st")
            .And.Contain("redirect_uri=" + Uri.EscapeDataString(Redirect))
            .And.Contain("scope=" + Uri.EscapeDataString("openid email https://www.googleapis.com/auth/calendar.events"));
    }

    [Fact]
    public async Task A_code_exchange_posts_the_secret_and_reads_the_account_and_scopes()
    {
        _google.Respond(HttpStatusCode.OK, new
        {
            access_token = "at", expires_in = 3599, refresh_token = "rt",
            scope = "openid https://www.googleapis.com/auth/calendar.events email",
            id_token = IdToken("g-1", "cal@example.com"),
        });

        var grant = await Client().ExchangeCodeAsync("the-code", Redirect, CancellationToken.None);

        grant.Should().Be(new GoogleCalendarGrant("g-1", "cal@example.com", "rt", HasCalendarScope: true));
        var sent = _google.Requests.Single();
        sent.Url.Should().Be("https://oauth2.googleapis.com/token");
        sent.Body.Should().Contain("code=the-code").And.Contain("client_secret=client-secret")
            .And.Contain("grant_type=authorization_code").And.Contain("redirect_uri=" + Uri.EscapeDataString(Redirect));
    }

    [Fact]
    public async Task A_grant_without_the_calendar_scope_says_so()
    {
        _google.Respond(HttpStatusCode.OK, new { access_token = "at", refresh_token = "rt", scope = "openid email", id_token = IdToken("g", "e@x.com") });
        (await Client().ExchangeCodeAsync("c", Redirect, CancellationToken.None)).HasCalendarScope.Should().BeFalse();
    }

    [Fact]
    public async Task A_refused_code_and_an_outage_are_told_apart()
    {
        _google.Respond(HttpStatusCode.BadRequest, new { error = "invalid_grant" });
        await FluentActions.Awaiting(() => Client().ExchangeCodeAsync("c", Redirect, CancellationToken.None))
            .Should().ThrowAsync<GoogleCalendarCodeRejectedException>();

        _google.Respond(HttpStatusCode.ServiceUnavailable, new { error = "backend" });
        await FluentActions.Awaiting(() => Client().ExchangeCodeAsync("c", Redirect, CancellationToken.None))
            .Should().ThrowAsync<GoogleCalendarUnavailableException>();

        _google.Throw = true;
        await FluentActions.Awaiting(() => Client().ExchangeCodeAsync("c", Redirect, CancellationToken.None))
            .Should().ThrowAsync<GoogleCalendarUnavailableException>();
    }

    [Fact]
    public async Task Revocation_posts_the_token_and_treats_an_unknown_token_as_revoked()
    {
        _google.Respond(HttpStatusCode.OK, new { });
        await Client().RevokeAsync("rt", CancellationToken.None);
        _google.Requests.Last().Url.Should().Be("https://oauth2.googleapis.com/revoke");
        _google.Requests.Last().Body.Should().Be("token=rt");

        _google.Respond(HttpStatusCode.BadRequest, new { error = "invalid_token" });
        await Client().RevokeAsync("rt", CancellationToken.None);

        _google.Respond(HttpStatusCode.InternalServerError, new { });
        await FluentActions.Awaiting(() => Client().RevokeAsync("rt", CancellationToken.None))
            .Should().ThrowAsync<GoogleCalendarUnavailableException>();
    }

    private static readonly GoogleCalendarEventWrite Swim = new(
        Guid.Parse("11111111-2222-3333-4444-555555555555"), "Swim lessons", "Part of This weekend. Planned with Saturdaze.",
        "Port Credit Pool", new DateTime(2026, 5, 16, 9, 0, 0), new DateTime(2026, 5, 16, 10, 0, 0), "America/Toronto");

    [Fact]
    public async Task An_insert_refreshes_the_access_token_and_posts_the_event_with_its_block_marker()
    {
        // Traces to: L2-175 AC1
        _google.Respond(HttpStatusCode.OK, new { access_token = "at-1", expires_in = 3600 });
        _google.Respond(HttpStatusCode.OK, new { id = "ev-1" });

        var id = await Client().InsertEventAsync("rt", Swim, CancellationToken.None);

        id.Should().Be("ev-1");
        _google.Requests[0].Body.Should().Contain("grant_type=refresh_token").And.Contain("refresh_token=rt");
        var insert = _google.Requests[1];
        insert.Method.Should().Be("POST");
        insert.Url.Should().Be("https://www.googleapis.com/calendar/v3/calendars/primary/events");
        insert.Authorization.Should().Be("Bearer at-1");
        var body = JsonDocument.Parse(insert.Body).RootElement;
        body.GetProperty("summary").GetString().Should().Be("Swim lessons");
        body.GetProperty("location").GetString().Should().Be("Port Credit Pool");
        body.GetProperty("start").GetProperty("dateTime").GetString().Should().Be("2026-05-16T09:00:00");
        body.GetProperty("start").GetProperty("timeZone").GetString().Should().Be("America/Toronto");
        body.GetProperty("end").GetProperty("dateTime").GetString().Should().Be("2026-05-16T10:00:00");
        body.GetProperty("extendedProperties").GetProperty("private").GetProperty("saturdazeBlock").GetString()
            .Should().Be("11111111-2222-3333-4444-555555555555");
    }

    [Fact]
    public async Task An_update_of_an_event_deleted_in_google_reports_it_gone_and_a_delete_of_one_is_done()
    {
        // Traces to: L2-175 AC5
        var client = Client();
        _google.Respond(HttpStatusCode.OK, new { access_token = "at", expires_in = 3600 });
        _google.Respond(HttpStatusCode.NotFound, new { });
        (await client.UpdateEventAsync("rt", "ev-1", Swim, CancellationToken.None)).Should().BeFalse();

        _google.Respond(HttpStatusCode.OK, new { id = "ev-1", status = "cancelled" });
        (await client.UpdateEventAsync("rt", "ev-1", Swim, CancellationToken.None)).Should().BeFalse();

        _google.Respond(HttpStatusCode.OK, new { id = "ev-1", status = "confirmed" });
        (await client.UpdateEventAsync("rt", "ev-1", Swim, CancellationToken.None)).Should().BeTrue();
        _google.Requests.Last().Method.Should().Be("PUT");
        _google.Requests.Last().Url.Should().EndWith("/events/ev-1");

        _google.Respond(HttpStatusCode.Gone, new { });
        await client.DeleteEventAsync("rt", "ev-1", CancellationToken.None);
        _google.Requests.Last().Method.Should().Be("DELETE");
    }

    [Fact]
    public async Task A_refused_refresh_token_is_a_revoked_grant_and_a_server_error_an_outage()
    {
        // Traces to: L2-177 AC1
        _google.Respond(HttpStatusCode.BadRequest, new { error = "invalid_grant" });
        await FluentActions.Awaiting(() => Client().InsertEventAsync("rt", Swim, CancellationToken.None))
            .Should().ThrowAsync<GoogleCalendarGrantRevokedException>();

        _google.Respond(HttpStatusCode.OK, new { access_token = "at", expires_in = 3600 });
        _google.Respond(HttpStatusCode.InternalServerError, new { });
        await FluentActions.Awaiting(() => Client().InsertEventAsync("rt", Swim, CancellationToken.None))
            .Should().ThrowAsync<GoogleCalendarUnavailableException>();
    }

    [Fact]
    public async Task A_list_reads_every_page_and_marks_all_day_declined_free_cancelled_and_saturdaze_events()
    {
        // Traces to: L2-176 AC2
        _google.Respond(HttpStatusCode.OK, new { access_token = "at", expires_in = 3600 });
        _google.Respond(HttpStatusCode.OK, new
        {
            nextPageToken = "p2",
            items = new object[]
            {
                new { id = "a", summary = "Party", start = new { dateTime = "2026-05-16T15:00:00-04:00" }, end = new { dateTime = "2026-05-16T17:00:00-04:00" } },
                new { id = "b", summary = "Holiday", start = new { date = "2026-05-16" }, end = new { date = "2026-05-17" } },
                new { id = "c", summary = "Lunch", start = new { dateTime = "2026-05-16T12:00:00-04:00" }, end = new { dateTime = "2026-05-16T13:00:00-04:00" },
                    attendees = new object[] { new { self = true, responseStatus = "declined" } } },
            },
        });
        _google.Respond(HttpStatusCode.OK, new
        {
            items = new object[]
            {
                new { id = "d", summary = "Focus", transparency = "transparent", start = new { dateTime = "2026-05-17T09:00:00-04:00" }, end = new { dateTime = "2026-05-17T10:00:00-04:00" } },
                new { id = "e", status = "cancelled", start = new { dateTime = "2026-05-17T11:00:00-04:00" }, end = new { dateTime = "2026-05-17T12:00:00-04:00" } },
                new { id = "f", summary = "Swim", start = new { dateTime = "2026-05-16T09:00:00-04:00" }, end = new { dateTime = "2026-05-16T10:00:00-04:00" },
                    extendedProperties = new { @private = new { saturdazeBlock = Guid.NewGuid().ToString() } } },
            },
        });

        var events = await Client().ListEventsAsync("rt",
            new DateTimeOffset(2026, 5, 16, 0, 0, 0, TimeSpan.FromHours(-4)), new DateTimeOffset(2026, 5, 18, 0, 0, 0, TimeSpan.FromHours(-4)),
            CancellationToken.None);

        events.Select(e => e.Id).Should().Equal("a", "b", "c", "d", "e", "f");
        events.Single(e => e.Id == "a").Should().Be(new GoogleCalendarEvent("a", "Party",
            new DateTimeOffset(2026, 5, 16, 15, 0, 0, TimeSpan.FromHours(-4)), new DateTimeOffset(2026, 5, 16, 17, 0, 0, TimeSpan.FromHours(-4)),
            AllDay: false, Cancelled: false, Declined: false, Free: false, WrittenBySaturdaze: false));
        events.Single(e => e.Id == "b").AllDay.Should().BeTrue();
        events.Single(e => e.Id == "c").Declined.Should().BeTrue();
        events.Single(e => e.Id == "d").Free.Should().BeTrue();
        events.Single(e => e.Id == "e").Cancelled.Should().BeTrue();
        events.Single(e => e.Id == "f").WrittenBySaturdaze.Should().BeTrue();
        var firstPage = _google.Requests[1];
        firstPage.Method.Should().Be("GET");
        _google.Requests[2].Url.Should().Be("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    }

    internal sealed class SingleClientFactory : IHttpClientFactory
    {
        private readonly HttpMessageHandler _handler;
        public SingleClientFactory(HttpMessageHandler handler) => _handler = handler;
        public HttpClient CreateClient(string name) => new(_handler, disposeHandler: false);
    }

    /// <summary>Answers every request with the queued response and records what was sent.</summary>
    internal sealed class FakeGoogle : HttpMessageHandler
    {
        private readonly Queue<(HttpStatusCode, string)> _responses = new();
        public List<(string Method, string Url, string Body, string? Authorization)> Requests { get; } = new();
        public bool Throw { get; set; }

        public void Respond(HttpStatusCode status, object body) => _responses.Enqueue((status, JsonSerializer.Serialize(body)));

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            if (Throw) throw new HttpRequestException("network down");
            var body = request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(ct);
            Requests.Add((request.Method.Method, request.RequestUri!.GetLeftPart(UriPartial.Path), body,
                request.Headers.Authorization?.ToString()));
            var (status, json) = _responses.Count > 0 ? _responses.Dequeue() : (HttpStatusCode.OK, "{}");
            return new HttpResponseMessage(status) { Content = new StringContent(json, Encoding.UTF8, "application/json") };
        }
    }
}
