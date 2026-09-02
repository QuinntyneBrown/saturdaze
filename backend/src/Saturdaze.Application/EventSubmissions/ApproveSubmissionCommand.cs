using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.EventSubmissions;

/// <summary>
/// Publishes a pending submission. The admin may supply the drive time from
/// home (ADR-006); otherwise the submission's own value, then 0, is used.
/// </summary>
public sealed record ApproveSubmissionCommand(Guid Id, int? DriveMinutes = null) : IRequest<EventSubmissionDto>;
