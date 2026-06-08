using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.EventSubmissions;

public sealed record ApproveSubmissionCommand(Guid Id) : IRequest<EventSubmissionDto>;
