using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Errands;

/// <summary>
/// Adds an errand and slots it into the itinerary straight away, trying
/// <paramref name="PreferredDay"/> first (Saturday when unspecified).
/// </summary>
public sealed record AddShoppingErrandCommand(
    Guid WeekendId,
    string Description,
    int EstimatedMinutes,
    DayOfWeekend? PreferredDay = null) : IRequest<WeekendDto>;
