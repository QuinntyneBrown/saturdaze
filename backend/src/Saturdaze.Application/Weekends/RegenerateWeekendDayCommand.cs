using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;
using Saturdaze.Application.Calendar;

namespace Saturdaze.Application.Weekends;

public sealed record RegenerateWeekendDayCommand(
    Guid WeekendId,
    DayOfWeekend Day) : IRequest<WeekendDto>, IChangesItinerary;
