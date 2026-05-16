using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Blocks;

public sealed record LockBlockCommand(Guid BlockId, bool Locked) : IRequest<WeekendDto>;
