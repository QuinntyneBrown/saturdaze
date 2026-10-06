namespace Saturdaze.Application.Contracts;

/// <summary>A place's primary photo (L2-088): <c>photo: { url, width, height, alt, attribution }</c>.</summary>
public sealed record PlacePhotoDto(string Url, int Width, int Height, string Alt, string Attribution);
