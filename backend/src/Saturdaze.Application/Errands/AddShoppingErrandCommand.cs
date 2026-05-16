using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Errands;

public sealed record AddShoppingErrandCommand(
    Guid WeekendId,
    string Description,
    int EstimatedMinutes) : IRequest<WeekendDto>;
