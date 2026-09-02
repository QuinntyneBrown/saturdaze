using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Weekends;

/// <summary>1–5 stars, or null to clear (L2-026).</summary>
public sealed record RateWeekendCommand(Guid WeekendId, int? Rating) : IRequest<WeekendDto>;
