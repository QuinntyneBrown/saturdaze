using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.EventSubmissions;

internal static class EventSubmissionMapper
{
    public static EventSubmissionDto ToDto(EventSubmission s, string? submitterEmail) =>
        new(
            s.Id,
            s.Title,
            s.StartsAtLocal,
            s.EndsAtLocal,
            s.Location,
            s.Description,
            s.CostNote,
            s.AgeRange,
            s.SourceUrl,
            s.Category,
            s.DriveMinutes,
            s.Status,
            s.SubmittedByUserId,
            submitterEmail,
            s.SubmittedAtUtc,
            s.ReviewedAtUtc,
            s.RejectionReason);
}
