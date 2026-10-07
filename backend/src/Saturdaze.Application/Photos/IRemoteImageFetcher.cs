namespace Saturdaze.Application.Photos;

/// <summary>
/// One fetch of an allow-listed image URL to verify it before it is saved (L2-116): the
/// bytes, or null when the response is not successful, exceeds the size cap or times out.
/// Callers check the origin first; this port never reaches an address outside the allow-list.
/// </summary>
public interface IRemoteImageFetcher
{
    /// <summary>Fetches at most 10 MB within 10 s.</summary>
    Task<byte[]?> FetchAsync(Uri url, CancellationToken ct);
}
