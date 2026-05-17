using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Restaurants;

public sealed record VoteRestaurantCommand(
    Guid RestaurantId,
    string VoterName,
    string Vote) : IRequest<RestaurantDto>;
