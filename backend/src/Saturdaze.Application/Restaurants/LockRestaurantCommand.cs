using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Restaurants;

public sealed record LockRestaurantCommand(
    Guid RestaurantId,
    DayOfWeekend Day,
    MealSlot Slot) : IRequest<RestaurantDto>;
