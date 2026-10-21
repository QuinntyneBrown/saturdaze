using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Calendar;

namespace Saturdaze.Application.Errands;

public sealed record MarkErrandDoneCommand(Guid ErrandId, bool Done) : IRequest<WeekendDto>, IChangesItinerary;
