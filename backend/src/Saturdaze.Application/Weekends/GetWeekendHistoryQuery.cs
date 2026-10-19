using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Weekends;

/// <summary>
/// One page of past weekends, newest first (L2-025). <paramref name="Before"/>
/// continues after the oldest weekend already received.
/// </summary>
public sealed record GetWeekendHistoryQuery(int Take = 20, DateOnly? Before = null) : IRequest<WeekendHistoryPage>;

/// <summary>The page plus the family's number of past weekends.</summary>
public sealed record WeekendHistoryPage(IReadOnlyList<WeekendSummaryDto> Items, int TotalCount);
