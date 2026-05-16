using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Weekends;

public sealed record GetCurrentWeekendQuery : IRequest<WeekendDto>;
