using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Calendar;

namespace Saturdaze.Application.Weekends;

public sealed record ReuseWeekendCommand(
    Guid SourceWeekendId,
    bool Remix) : IRequest<WeekendDto>, IChangesItinerary;
