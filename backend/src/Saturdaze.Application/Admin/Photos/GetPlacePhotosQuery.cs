using MediatR;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>Every photo of one catalog place for the Place photos screen (L2-114).</summary>
public sealed record GetPlacePhotosQuery(PlaceKind Kind, Guid PlaceId) : IRequest<PlacePhotosDto>;
