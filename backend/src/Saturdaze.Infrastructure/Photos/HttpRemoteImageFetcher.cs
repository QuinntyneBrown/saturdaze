using Saturdaze.Application.Photos;

namespace Saturdaze.Infrastructure.Photos;

/// <summary>
/// Fetches an allow-listed image once over HTTPS (L2-116): 10 s in total, at most 10 MB read,
/// null for anything else. The caller has already checked the origin, so this never reaches an
/// internal host.
/// </summary>
public sealed class HttpRemoteImageFetcher : IRemoteImageFetcher
{
    public const string HttpClientName = "RemoteImages";
    public static readonly TimeSpan Timeout = TimeSpan.FromSeconds(10);
    public const long MaxBytes = PhotoOptions.MaxUploadBytes;

    private readonly IHttpClientFactory _factory;

    public HttpRemoteImageFetcher(IHttpClientFactory factory) => _factory = factory;

    public async Task<byte[]?> FetchAsync(Uri url, CancellationToken ct)
    {
        if (url.Scheme != Uri.UriSchemeHttps) return null;
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(Timeout);
            using var http = _factory.CreateClient(HttpClientName);
            using var res = await http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
            if (!res.IsSuccessStatusCode) return null;
            if (res.Content.Headers.ContentLength is > MaxBytes) return null;

            await using var stream = await res.Content.ReadAsStreamAsync(timeout.Token);
            using var buffer = new MemoryStream();
            var chunk = new byte[64 * 1024];
            int read;
            while ((read = await stream.ReadAsync(chunk, timeout.Token)) > 0)
            {
                if (buffer.Length + read > MaxBytes) return null;
                buffer.Write(chunk, 0, read);
            }
            return buffer.ToArray();
        }
        catch (Exception ex) when (ex is HttpRequestException or OperationCanceledException or IOException)
        {
            return null;
        }
    }
}
