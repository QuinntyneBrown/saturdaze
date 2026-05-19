using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Contracts;

public sealed record EventSubmissionDto(
    Guid Id,
    string Title,
    DateTime StartsAtLocal,
    DateTime? EndsAtLocal,
    string? Location,
    string? Description,
    string? CostNote,
    string? AgeRange,
    string? SourceUrl,
    string? Category,
    int? DriveMinutes,
    EventSubmissionStatus Status,
    Guid SubmittedByUserId,
    string? SubmittedByEmail,
    DateTimeOffset SubmittedAtUtc,
    DateTimeOffset? ReviewedAtUtc,
    string? RejectionReason);
