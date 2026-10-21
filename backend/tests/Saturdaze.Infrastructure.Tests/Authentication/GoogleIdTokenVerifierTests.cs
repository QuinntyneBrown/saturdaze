// Traces to: L2-163 AC10
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Saturdaze.Infrastructure.Authentication;
using Xunit;

namespace Saturdaze.Infrastructure.Tests.Authentication;

/// <summary>
/// The verifier's rules, with Google replaced by a throwaway RSA key and a
/// fake JWKS endpoint (ADR-019 decision 2). No network.
/// </summary>
public class GoogleIdTokenVerifierTests
{
    private const string ClientId = "saturdaze-test.apps.googleusercontent.com";

    private static readonly RsaSecurityKey GoogleKey = NewKey("google-key-1");
    private static readonly RsaSecurityKey OtherKey = NewKey("other-key-1");

    [Fact]
    public async Task Accepts_a_token_signed_by_a_published_key_for_the_configured_client()
    {
        var jwks = new FakeJwksHandler(Jwks(GoogleKey));
        var verifier = NewVerifier(jwks, ClientId);

        var identity = await verifier.VerifyAsync(Token(GoogleKey, audience: ClientId), CancellationToken.None);

        identity.Should().NotBeNull();
        identity!.Subject.Should().Be("1234567890");
        identity.Email.Should().Be("quinn@example.com");
        identity.EmailVerified.Should().BeTrue();
        verifier.IsConfigured.Should().BeTrue();
    }

    [Fact]
    public async Task Reads_email_verified_when_google_sends_it_as_a_string()
    {
        var verifier = NewVerifier(new FakeJwksHandler(Jwks(GoogleKey)), ClientId);

        var identity = await verifier.VerifyAsync(Token(GoogleKey, audience: ClientId, emailVerified: "false"), CancellationToken.None);

        identity.Should().NotBeNull();
        identity!.EmailVerified.Should().BeFalse();
    }

    [Fact]
    public async Task Refuses_a_token_for_another_client()
    {
        var verifier = NewVerifier(new FakeJwksHandler(Jwks(GoogleKey)), ClientId);

        var identity = await verifier.VerifyAsync(Token(GoogleKey, audience: "someone-else"), CancellationToken.None);

        identity.Should().BeNull();
    }

    [Fact]
    public async Task Refuses_an_expired_token()
    {
        var verifier = NewVerifier(new FakeJwksHandler(Jwks(GoogleKey)), ClientId);

        var identity = await verifier.VerifyAsync(
            Token(GoogleKey, audience: ClientId, expires: DateTime.UtcNow.AddHours(-1)), CancellationToken.None);

        identity.Should().BeNull();
    }

    [Fact]
    public async Task Refuses_a_token_from_another_issuer()
    {
        var verifier = NewVerifier(new FakeJwksHandler(Jwks(GoogleKey)), ClientId);

        var identity = await verifier.VerifyAsync(
            Token(GoogleKey, audience: ClientId, issuer: "https://evil.example"), CancellationToken.None);

        identity.Should().BeNull();
    }

    [Fact]
    public async Task Refuses_a_token_signed_by_an_unpublished_key_after_one_key_refresh()
    {
        var jwks = new FakeJwksHandler(Jwks(GoogleKey));
        var verifier = NewVerifier(jwks, ClientId);

        var identity = await verifier.VerifyAsync(Token(OtherKey, audience: ClientId), CancellationToken.None);

        identity.Should().BeNull();
        jwks.Calls.Should().Be(2, "an unknown key id triggers exactly one refresh");
    }

    [Fact]
    public async Task Refuses_garbage()
    {
        var verifier = NewVerifier(new FakeJwksHandler(Jwks(GoogleKey)), ClientId);

        (await verifier.VerifyAsync("not.a.jwt", CancellationToken.None)).Should().BeNull();
        (await verifier.VerifyAsync("", CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task Caches_the_keys_between_tokens()
    {
        var jwks = new FakeJwksHandler(Jwks(GoogleKey));
        var verifier = NewVerifier(jwks, ClientId);

        await verifier.VerifyAsync(Token(GoogleKey, audience: ClientId), CancellationToken.None);
        await verifier.VerifyAsync(Token(GoogleKey, audience: ClientId), CancellationToken.None);

        jwks.Calls.Should().Be(1);
    }

    [Fact]
    public async Task Picks_up_a_rotated_key_without_waiting_for_the_cache()
    {
        var jwks = new FakeJwksHandler(Jwks(GoogleKey));
        var verifier = NewVerifier(jwks, ClientId);
        await verifier.VerifyAsync(Token(GoogleKey, audience: ClientId), CancellationToken.None);

        jwks.Body = Jwks(GoogleKey, OtherKey);
        var identity = await verifier.VerifyAsync(Token(OtherKey, audience: ClientId), CancellationToken.None);

        identity.Should().NotBeNull();
        jwks.Calls.Should().Be(2);
    }

    [Fact]
    public void Is_not_configured_without_a_client_id()
    {
        NewVerifier(new FakeJwksHandler(Jwks(GoogleKey)), "").IsConfigured.Should().BeFalse();
    }

    // ---- helpers ----

    private static GoogleIdTokenVerifier NewVerifier(FakeJwksHandler handler, string clientId)
    {
        var http = new HttpClient(handler);
        return new GoogleIdTokenVerifier(
            new SingleClientFactory(http),
            new MemoryCache(new MemoryCacheOptions()),
            Options.Create(new GoogleOptions { ClientId = clientId }),
            NullLogger<GoogleIdTokenVerifier>.Instance);
    }

    private static RsaSecurityKey NewKey(string kid)
        => new(RSA.Create(2048)) { KeyId = kid };

    private static string Token(
        RsaSecurityKey key,
        string audience,
        string issuer = "https://accounts.google.com",
        DateTime? expires = null,
        object emailVerified = null!)
    {
        var claims = new List<Claim>
        {
            new("sub", "1234567890"),
            new("email", "quinn@example.com"),
        };
        // Google sends a JSON boolean; the string form guards against a tokeniser that stringifies it.
        claims.Add(emailVerified is string s
            ? new Claim("email_verified", s)
            : new Claim("email_verified", "true", ClaimValueTypes.Boolean));
        var now = DateTime.UtcNow;
        var expiresAt = expires ?? now.AddHours(1);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: expiresAt.AddHours(-2),
            expires: expiresAt,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.RsaSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string Jwks(params RsaSecurityKey[] keys)
    {
        var set = new JsonWebKeySet();
        foreach (var key in keys)
        {
            var jwk = JsonWebKeyConverter.ConvertFromRSASecurityKey(new RsaSecurityKey(key.Rsa.ExportParameters(false)) { KeyId = key.KeyId });
            jwk.Use = "sig";
            jwk.Alg = SecurityAlgorithms.RsaSha256;
            set.Keys.Add(jwk);
        }
        return JsonSerializer.Serialize(set);
    }

    private sealed class SingleClientFactory : IHttpClientFactory
    {
        private readonly HttpClient _client;
        public SingleClientFactory(HttpClient client) => _client = client;
        public HttpClient CreateClient(string name) => _client;
    }

    private sealed class FakeJwksHandler : HttpMessageHandler
    {
        public FakeJwksHandler(string body) => Body = body;
        public string Body { get; set; }
        public int Calls { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(Body, System.Text.Encoding.UTF8, "application/json"),
            };
            response.Headers.CacheControl = new CacheControlHeaderValue { MaxAge = TimeSpan.FromHours(6) };
            return Task.FromResult(response);
        }
    }
}
