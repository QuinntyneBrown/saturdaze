using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Common;
using Saturdaze.Application.Photos;

namespace Saturdaze.Infrastructure.Photos;

/// <summary>
/// <c>/api/photos/{key}?exp={unix}&amp;sig={hmac}</c>: an HMAC-SHA256 over the key and
/// expiry, so a URL cannot be extended or pointed at another photo (L2-097 AC5).
/// </summary>
public sealed class HmacPhotoUrlSigner : IPhotoUrlSigner
{
    private readonly byte[] _key;
    private readonly IDateTimeProvider _clock;

    public HmacPhotoUrlSigner(IOptions<PhotoOptions> options, IDateTimeProvider clock)
    {
        var secret = options.Value.SigningKey;
        if (Encoding.UTF8.GetByteCount(secret) < 32)
            throw new InvalidOperationException("Saturdaze:Photos:SigningKey must be at least 32 bytes.");
        _key = Encoding.UTF8.GetBytes(secret);
        _clock = clock;
    }

    public string SignedUrl(string key, TimeSpan lifetime)
    {
        var expires = _clock.UtcNow.Add(lifetime).ToUnixTimeSeconds();
        return $"/api/photos/{Uri.EscapeDataString(key)}?exp={expires}&sig={Sign(key, expires)}";
    }

    public bool IsValid(string key, long expiresUnixSeconds, string signature)
    {
        if (expiresUnixSeconds <= _clock.UtcNow.ToUnixTimeSeconds()) return false;
        var expected = Encoding.ASCII.GetBytes(Sign(key, expiresUnixSeconds));
        var actual = Encoding.ASCII.GetBytes(signature ?? string.Empty);
        return CryptographicOperations.FixedTimeEquals(expected, actual);
    }

    private string Sign(string key, long expires)
    {
        var mac = HMACSHA256.HashData(_key, Encoding.UTF8.GetBytes($"{key}|{expires}"));
        return Convert.ToBase64String(mac).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }
}
