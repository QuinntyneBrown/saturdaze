using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Blocks;

public sealed record SwapBlockCommand(
    Guid BlockId,
    IReadOnlyList<Guid>? RejectedActivityIds = null) : IRequest<WeekendDto>;
