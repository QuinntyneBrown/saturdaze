using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Calendar;

namespace Saturdaze.Application.Weekends;

/// <summary>Sets or clears the user-supplied weekend title (L1-010).</summary>
public sealed record RenameWeekendCommand(Guid WeekendId, string? Title) : IRequest<WeekendDto>, IChangesItinerary;
