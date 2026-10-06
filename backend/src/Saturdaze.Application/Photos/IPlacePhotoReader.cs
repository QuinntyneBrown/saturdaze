using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Photos;

/// <summary>Reads the safe primary photo of each listed place (L2-088, L2-089 AC3).</summary>
public interface IPlacePhotoReader
{
    /// <summary>Primary photos keyed by place id; places without a usable photo are absent.</summary>
    Task<IReadOnlyDictionary<Guid, PlacePhotoDto>> PrimaryPhotosAsync(
        PlaceKind kind,
        IReadOnlyCollection<(Guid Id, string Name)> places,
        CancellationToken ct);
}
