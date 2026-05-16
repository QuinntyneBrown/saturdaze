using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Activities;

public sealed record GetActivitySuggestionsQuery(
    bool? Indoor = null,
    int? MaxDriveMinutes = null,
    int? MinAge = null,
    int? MaxAge = null,
    string? Weather = null,
    bool TryNew = false,
    int Take = 50) : IRequest<IReadOnlyList<ActivityDto>>;
