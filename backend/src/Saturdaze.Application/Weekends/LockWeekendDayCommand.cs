using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Weekends;

public sealed record LockWeekendDayCommand(
    Guid WeekendId,
    DayOfWeekend Day,
    bool Locked) : IRequest<WeekendDto>;
