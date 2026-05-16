using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Events;

public sealed record GetLocalEventsQuery(
    DateOnly WeekendOf,
    int MaxDriveMinutes = 120) : IRequest<IReadOnlyList<LocalEventDto>>;
