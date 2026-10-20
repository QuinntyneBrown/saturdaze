using Saturdaze.Application.Photos;

namespace Saturdaze.Api.Tests.Support;

/// <summary>Test-controlled public-web fetcher: bytes per address; anything else is unreachable (null).</summary>
public sealed class FakePublicImageFetcher : IPublicImageFetcher
{
    public Dictionary<string, byte[]> Responses { get; } = new(StringComparer.OrdinalIgnoreCase);
    public List<Uri> Requested { get; } = new();

    public Task<byte[]?> FetchAsync(Uri url, CancellationToken ct)
    {
        Requested.Add(url);
        return Task.FromResult(Responses.TryGetValue(url.ToString(), out var bytes) ? bytes : null);
    }
}
