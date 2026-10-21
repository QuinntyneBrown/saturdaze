using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Calendar;

namespace Saturdaze.Application.Blocks;

public sealed record LockBlockCommand(Guid BlockId, bool Locked) : IRequest<WeekendDto>, IChangesItinerary;
