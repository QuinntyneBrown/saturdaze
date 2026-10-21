using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Calendar;

namespace Saturdaze.Application.Weekends;

public sealed record RegenerateWeekendCommand(Guid WeekendId) : IRequest<WeekendDto>, IChangesItinerary;
