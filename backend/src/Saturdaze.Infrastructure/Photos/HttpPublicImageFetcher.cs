using System.Net;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;
using Saturdaze.Application.Photos;

namespace Saturdaze.Infrastructure.Photos;

/// <summary>
/// Fetches a candidate image from the open web (L2-157 AC2). HTTPS only; the host is resolved
/// inside the connect callback and every address is checked with
/// <see cref="PublicImageAddress.IsPublic"/> before the socket opens, so a second DNS answer
/// cannot point the request at a private address. No redirects are followed; the read stops at
/// 10 MB or 10 s. Anything else is null, never an exception.
/// </summary>
public sealed class HttpPublicImageFetcher : IPublicImageFetcher, IDisposable
{
    public static readonly TimeSpan Timeout = TimeSpan.FromSeconds(10);
    public const long MaxBytes = PhotoOptions.MaxUploadBytes;

    private readonly HttpClient _http;
    private readonly ILogger<HttpPublicImageFetcher> _logger;

    public HttpPublicImageFetcher(ILogger<HttpPublicImageFetcher> logger)
    {
        _logger = logger;
        var handler = new SocketsHttpHandler
        {
            AllowAutoRedirect = false,
            UseCookies = false,
            ConnectTimeout = TimeSpan.FromSeconds(5),
            PooledConnectionLifetime = TimeSpan.FromMinutes(2),
            ConnectCallback = ConnectToPublicAddressAsync,
        };
        _http = new HttpClient(handler, disposeHandler: true)
        {
            Timeout = Timeout,
            MaxResponseContentBufferSize = MaxBytes,
        };
        _http.DefaultRequestHeaders.UserAgent.ParseAdd("Saturdaze/1.0 (+https://www.saturdaze.ca)");
        _http.DefaultRequestHeaders.Accept.ParseAdd("image/jpeg,image/png,image/webp;q=0.9,*/*;q=0.1");
    }

    public async Task<byte[]?> FetchAsync(Uri url, CancellationToken ct)
    {
        if (!PublicImageAddress.IsCandidate(url)) return null;
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(Timeout);
            using var res = await _http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
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
        catch (Exception ex) when (ex is HttpRequestException or OperationCanceledException or IOException or SocketException)
        {
            _logger.LogDebug(ex, "Candidate image on {Host} was not fetched", url.Host);
            return null;
        }
    }

    private static async ValueTask<Stream> ConnectToPublicAddressAsync(SocketsHttpConnectionContext context, CancellationToken ct)
    {
        var endpoint = context.DnsEndPoint;
        IPAddress[] addresses = IPAddress.TryParse(endpoint.Host, out var literal)
            ? [literal]
            : await Dns.GetHostAddressesAsync(endpoint.Host, ct);
        if (addresses.Length == 0 || addresses.Any(a => !PublicImageAddress.IsPublic(a)))
            throw new HttpRequestException($"{endpoint.Host} does not resolve to a public address.");

        var socket = new Socket(SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
        try
        {
            await socket.ConnectAsync(addresses, endpoint.Port, ct);
            return new NetworkStream(socket, ownsSocket: true);
        }
        catch
        {
            socket.Dispose();
            throw;
        }
    }

    public void Dispose() => _http.Dispose();
}
