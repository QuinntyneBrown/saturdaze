using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Calendar;

namespace Saturdaze.Application.Blocks;

public sealed record SwapBlockCommand(
    Guid BlockId,
    IReadOnlyList<Guid>? RejectedActivityIds = null) : IRequest<WeekendDto>, IChangesItinerary;
