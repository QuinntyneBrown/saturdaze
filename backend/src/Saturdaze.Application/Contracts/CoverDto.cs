namespace Saturdaze.Application.Contracts;

/// <summary>
/// The weekend's cover photo (L2-096): where it comes from (<c>default</c>, <c>stop</c>,
/// <c>upload</c>), the label shown with it ("From La Marina" / "Your photo"), and the photo.
/// </summary>
public sealed record CoverDto(
    string Url,
    int Width,
    int Height,
    string Alt,
    string Attribution,
    string Label,
    string Source,
    Guid? PlaceId);
