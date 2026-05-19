using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.EventSubmissions;

public sealed record ListMySubmissionsQuery() : IRequest<IReadOnlyList<EventSubmissionDto>>;
