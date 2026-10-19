using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Weekends;

/// <summary>
/// The weekend behind a share link or its calendar (L2-086). Unscoped by family:
/// the unexpired, unrevoked share token is the capability.
/// </summary>
public sealed record GetSharedWeekendQuery(string Token) : IRequest<WeekendDto>;
