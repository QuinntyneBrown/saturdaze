using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Weekends;

public sealed record GetWeekendHistoryQuery(int Take = 20) : IRequest<IReadOnlyList<WeekendSummaryDto>>;
