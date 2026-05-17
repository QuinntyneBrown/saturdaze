using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Weekends;

public sealed record RegenerateWeekendDayCommand(
    Guid WeekendId,
    DayOfWeekend Day) : IRequest<WeekendDto>;
