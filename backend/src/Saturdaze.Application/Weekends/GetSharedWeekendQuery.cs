using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Weekends;

/// <summary>
/// Read-only view behind a share link or calendar subscription. Deliberately
/// unscoped: possession of the weekend id is the capability.
/// </summary>
public sealed record GetSharedWeekendQuery(Guid Id) : IRequest<WeekendDto>;
