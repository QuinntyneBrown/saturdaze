using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Ideas;

/// <summary>Which catalog an idea comes from (L2-107).</summary>
public enum IdeaKind
{
    Activity,
    Event
}

/// <summary>The family's coarse preference for where an idea lands.</summary>
public enum IdeaTiming
{
    BestFit,
    Morning,
    Afternoon
}

/// <summary>Where the planner would put an idea, without changing anything (L2-107 AC2).</summary>
public sealed record PreviewIdeaPlacementQuery(
    Guid WeekendId,
    IdeaKind IdeaKind,
    Guid IdeaId,
    DayOfWeekend Day,
    IdeaTiming Timing) : IRequest<IdeaPlacementDto>;

/// <summary>Adds an idea to the weekend at the previewed placement (L2-107 AC3).</summary>
public sealed record AddIdeaToWeekendCommand(
    Guid WeekendId,
    IdeaKind IdeaKind,
    Guid IdeaId,
    DayOfWeekend Day,
    IdeaTiming Timing) : IRequest<WeekendDto>;
