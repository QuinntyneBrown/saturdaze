using FluentValidation;
using MediatR;
using Saturdaze.Application.Calendar;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Dates;

/// <summary>Plan a date, or return the one already on that meal and day (L2-219, ADR-003).</summary>
public sealed record PlanDateCommand(
    Guid WeekendId, DayOfWeekend? Day, MealSlot? Meal, IReadOnlyList<Guid>? AttendeeMemberIds)
    : IRequest<CoupleDateDto>, IChangesItinerary;

public sealed record GetDatesQuery(Guid WeekendId) : IRequest<CoupleDatesDto>;

public enum DateChange
{
    Move,
    Regenerate,
    SwapRestaurant,
    SwapActivity,
    DropActivity
}

/// <summary>Swap, drop, move or regenerate a date (L2-223).</summary>
public sealed record ChangeDateCommand(
    Guid WeekendId, Guid DateId, DateChange Change, DayOfWeekend? Day = null, MealSlot? Meal = null)
    : IRequest<CoupleDateDto>, IChangesItinerary;

public sealed record CancelDateCommand(Guid WeekendId, Guid DateId) : IRequest, IChangesItinerary;

public sealed class PlanDateCommandValidator : AbstractValidator<PlanDateCommand>
{
    public PlanDateCommandValidator()
    {
        RuleFor(x => x.Day).NotNull().IsInEnum().WithMessage("Pick Saturday or Sunday.");
        RuleFor(x => x.Meal).NotNull().IsInEnum().WithMessage("Pick breakfast, lunch or dinner.");
    }
}

public sealed class ChangeDateCommandValidator : AbstractValidator<ChangeDateCommand>
{
    public ChangeDateCommandValidator()
    {
        When(x => x.Change == DateChange.Move, () =>
        {
            RuleFor(x => x.Day).NotNull().IsInEnum().WithMessage("Pick Saturday or Sunday.");
            RuleFor(x => x.Meal).NotNull().IsInEnum().WithMessage("Pick breakfast, lunch or dinner.");
        });
    }
}
