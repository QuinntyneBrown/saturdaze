using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.EventSubmissions;

/// <summary>
/// Publishes a pending submission. The admin may supply the drive time from
/// home (ADR-006); otherwise the submission's own value, then 0, is used.
/// A published event needs a location (L2-087 AC3): the submission's own, or
/// one the admin supplies here; without either the approval is refused.
/// </summary>
public sealed record ApproveSubmissionCommand(
    Guid Id,
    int? DriveMinutes = null,
    decimal? Latitude = null,
    decimal? Longitude = null,
    string? Address = null) : IRequest<EventSubmissionDto>;
