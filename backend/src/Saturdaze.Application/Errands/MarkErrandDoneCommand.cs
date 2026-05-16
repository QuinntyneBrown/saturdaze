using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Errands;

public sealed record MarkErrandDoneCommand(Guid ErrandId, bool Done) : IRequest<WeekendDto>;
