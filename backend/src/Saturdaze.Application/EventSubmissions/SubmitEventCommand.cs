using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.EventSubmissions;

public sealed record SubmitEventCommand(
    string Title,
    DateTime StartsAtLocal,
    DateTime? EndsAtLocal = null,
    string? Location = null,
    string? Description = null,
    string? CostNote = null,
    string? AgeRange = null,
    string? SourceUrl = null,
    string? Category = null) : IRequest<EventSubmissionDto>;
