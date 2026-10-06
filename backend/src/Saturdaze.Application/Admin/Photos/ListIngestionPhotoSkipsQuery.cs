using MediatR;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>The 50 newest ingestion runs that skipped a photo, with each skip parsed and linked to its place (L2-120 AC5).</summary>
public sealed record ListIngestionPhotoSkipsQuery : IRequest<IReadOnlyList<IngestionPhotoSkipsDto>>;
