// Acceptance Test
// Traces to: L2-165 AC1, AC2, AC4, L2-167 AC1, L2-170
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
