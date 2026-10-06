using MediatR;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>The catalog places across the three catalogs for the admin Places screen (L2-113).</summary>
public sealed record ListAdminPlacesQuery : IRequest<AdminPlacePageDto>;
