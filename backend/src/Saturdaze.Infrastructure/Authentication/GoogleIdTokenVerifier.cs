using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Saturdaze.Application.Authentication;

namespace Saturdaze.Infrastructure.Authentication;

/// <summary>
/// Verifies Google ID tokens offline with the Microsoft.IdentityModel stack the
/// bearer middleware already uses (ADR-019 decision 2). Google's JWKS is cached
/// for its <c>Cache-Control: max-age</c> and refreshed once when a token names a
/// key id the cache does not hold, so a key rotation never waits for expiry.
/// </summary>
public sealed class GoogleIdTokenVerifier : IGoogleIdTokenVerifier
{
    public const string HttpClientName = "google-jwks";
    public const string JwksUrl = "https://www.googleapis.com/oauth2/v3/certs";

    private static readonly string[] Issuers = { "https://accounts.google.com", "accounts.google.com" };
    private static readonly TimeSpan DefaultCacheLifetime = TimeSpan.FromHours(1);
    private static readonly TimeSpan MinimumCacheLifetime = TimeSpan.FromMinutes(5);
    private const string CacheKey = "google-jwks";

    private readonly IHttpClientFactory _http;
    private readonly IMemoryCache _cache;
    private readonly GoogleOptions _options;
    private readonly ILogger<GoogleIdTokenVerifier> _logger;

    public GoogleIdTokenVerifier(
        IHttpClientFactory http,
        IMemoryCache cache,
        IOptions<GoogleOptions> options,
        ILogger<GoogleIdTokenVerifier> logger)
    {
        _http = http;
        _cache = cache;
        _options = options.Value;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.ClientId);

    public async Task<GoogleIdentity?> VerifyAsync(string idToken, CancellationToken ct)
    {
        if (!IsConfigured || string.IsNullOrWhiteSpace(idToken)) return null;

        var handler = new JsonWebTokenHandler { MapInboundClaims = false };
        string? kid;
        try
        {
            if (!handler.CanReadToken(idToken)) return null;
            kid = new JsonWebToken(idToken).Kid;
        }
        catch (ArgumentException)
        {
            return null; // three dot-separated parts that are not a JWT
        }

        IReadOnlyCollection<SecurityKey> keys;
        try
        {
            keys = await GetSigningKeysAsync(refresh: false, ct);
            if (!string.IsNullOrEmpty(kid) && keys.All(k => k.KeyId != kid))
            {
                keys = await GetSigningKeysAsync(refresh: true, ct);
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or ArgumentException)
        {
            _logger.LogWarning(ex, "Google signing keys could not be fetched; refusing the sign-in");
            return null;
        }

        var result = await handler.ValidateTokenAsync(idToken, new TokenValidationParameters
        {
            ValidIssuers = Issuers,
            ValidAudience = _options.ClientId,
            IssuerSigningKeys = keys,
            ValidAlgorithms = new[] { SecurityAlgorithms.RsaSha256 },
            RequireSignedTokens = true,
            RequireExpirationTime = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5),
        });
        if (!result.IsValid)
        {
            _logger.LogInformation("Google ID token refused: {Reason}", result.Exception?.GetType().Name);
            return null;
        }

        if (!result.Claims.TryGetValue("sub", out var sub) || sub is not string subject || subject.Length == 0) return null;
        if (!result.Claims.TryGetValue("email", out var mail) || mail is not string email || email.Length == 0) return null;
        var verified = result.Claims.TryGetValue("email_verified", out var flag) && flag switch
        {
            bool b => b,
            string s => string.Equals(s, "true", StringComparison.OrdinalIgnoreCase),
            _ => false,
        };
        return new GoogleIdentity(subject, email, verified);
    }

    private async Task<IReadOnlyCollection<SecurityKey>> GetSigningKeysAsync(bool refresh, CancellationToken ct)
    {
        if (!refresh && _cache.TryGetValue(CacheKey, out IReadOnlyCollection<SecurityKey>? cached) && cached is not null)
        {
            return cached;
        }

        var client = _http.CreateClient(HttpClientName);
        using var response = await client.GetAsync(JwksUrl, ct);
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync(ct);
        var keys = (IReadOnlyCollection<SecurityKey>)new JsonWebKeySet(json).GetSigningKeys();

        var lifetime = response.Headers.CacheControl?.MaxAge ?? DefaultCacheLifetime;
        if (lifetime < MinimumCacheLifetime) lifetime = MinimumCacheLifetime;
        _cache.Set(CacheKey, keys, lifetime);
        return keys;
    }
}
