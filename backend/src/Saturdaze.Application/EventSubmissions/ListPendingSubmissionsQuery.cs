using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.EventSubmissions;

public sealed record ListPendingSubmissionsQuery() : IRequest<IReadOnlyList<EventSubmissionDto>>;
