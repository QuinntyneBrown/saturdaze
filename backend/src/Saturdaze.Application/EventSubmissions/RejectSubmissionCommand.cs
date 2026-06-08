using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.EventSubmissions;

public sealed record RejectSubmissionCommand(Guid Id, string? Reason) : IRequest<EventSubmissionDto>;
