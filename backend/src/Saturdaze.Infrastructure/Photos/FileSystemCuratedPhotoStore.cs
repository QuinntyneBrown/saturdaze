using Microsoft.Extensions.Options;
using Saturdaze.Application.Photos;

namespace Saturdaze.Infrastructure.Photos;

/// <summary>
/// Curated place photos on the API's disk, served publicly by <c>GET /api/catalog-photos/{key}</c>
/// (ADR-015). Keys are random and never reused, so the files can be cached as immutable.
/// </summary>
public sealed class FileSystemCuratedPhotoStore : ICuratedPhotoStore
{
    private readonly string _root;
    private readonly string _publicOrigin;

    public FileSystemCuratedPhotoStore(IOptions<CuratedPhotoOptions> options)
    {
        _root = Path.GetFullPath(options.Value.Directory);
        _publicOrigin = options.Value.PublicOrigin.TrimEnd('/');
    }

    public async Task<string> PutAsync(byte[] content, string contentType, CancellationToken ct)
    {
        Directory.CreateDirectory(_root);
        var key = $"{Guid.NewGuid():N}{Extension(contentType)}";
        await File.WriteAllBytesAsync(PathOf(key), content, ct);
        return key;
    }

    public Task<StoredPhoto?> OpenAsync(string key, CancellationToken ct)
    {
        var path = PathOf(key);
        if (!IsValidKey(key) || !File.Exists(path)) return Task.FromResult<StoredPhoto?>(null);
        Stream stream = File.OpenRead(path);
        return Task.FromResult<StoredPhoto?>(new StoredPhoto(stream, ContentTypeOf(key)));
    }

    public Task DeleteAsync(string key, CancellationToken ct)
    {
        if (IsValidKey(key) && File.Exists(PathOf(key))) File.Delete(PathOf(key));
        return Task.CompletedTask;
    }

    public string PublicUrl(string key) => $"{_publicOrigin}/api/catalog-photos/{key}";

    private string PathOf(string key) => Path.Combine(_root, Path.GetFileName(key));

    /// <summary>A key is 32 hex characters plus a known extension, so it cannot escape the root.</summary>
    public static bool IsValidKey(string key) =>
        key.Length is > 32 and < 40
        && key[..32].All(Uri.IsHexDigit)
        && key[32..] is ".jpg" or ".png" or ".webp";

    private static string Extension(string contentType) => contentType switch
    {
        "image/png" => ".png",
        "image/webp" => ".webp",
        _ => ".jpg",
    };

    private static string ContentTypeOf(string key) => Path.GetExtension(key) switch
    {
        ".png" => "image/png",
        ".webp" => "image/webp",
        _ => "image/jpeg",
    };
}
