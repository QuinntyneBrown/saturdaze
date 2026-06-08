using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

public class EventSubmission
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime StartsAtLocal { get; set; }
    public DateTime? EndsAtLocal { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public string? CostNote { get; set; }
    public string? AgeRange { get; set; }
    public string? SourceUrl { get; set; }
    public string? Category { get; set; }
    public int? DriveMinutes { get; set; }
    public EventSubmissionStatus Status { get; set; } = EventSubmissionStatus.Pending;
    public Guid SubmittedByUserId { get; set; }
    public DateTimeOffset SubmittedAtUtc { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTimeOffset? ReviewedAtUtc { get; set; }
    public string? RejectionReason { get; set; }
    public Guid? PublishedEventId { get; set; }
}
