namespace Saturdaze.Application.Photos;

/// <summary>
/// One fetch of a candidate image from the public web (L2-157): the bytes, or null when the
/// address is not HTTPS, its host does not resolve to a public address, the response is not
/// successful, redirects, exceeds 10 MB or takes more than 10 s. Unlike
/// <see cref="IRemoteImageFetcher"/> the origin is not allow-listed, so the implementation
/// owns the address rules in <see cref="PublicImageAddress"/>.
/// </summary>
public interface IPublicImageFetcher
{
    Task<byte[]?> FetchAsync(Uri url, CancellationToken ct);
}
