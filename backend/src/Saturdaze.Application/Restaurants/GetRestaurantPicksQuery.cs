using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Restaurants;

public sealed record GetRestaurantPicksQuery(
    DateOnly Day,
    MealSlot Slot,
    Guid? NearActivityId = null,
    bool WifeApprovedOnly = true,
    int Take = 10) : IRequest<IReadOnlyList<RestaurantDto>>;
