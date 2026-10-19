using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Restaurants;

public sealed record VoteRestaurantCommand(
    Guid RestaurantId,
    string VoterName,
    string Vote,
    DayOfWeekend? Day = null,
    MealSlot? Slot = null) : IRequest<RestaurantDto>;
