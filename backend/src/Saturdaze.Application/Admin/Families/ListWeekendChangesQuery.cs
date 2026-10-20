using MediatR;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Families;

/// <summary>The family's administrator changes, newest first (L2-161).</summary>
public sealed record ListWeekendChangesQuery(Guid FamilyId, int Page) : IRequest<WeekendChangePageDto>
{
    public const int PageSize = 50;
}

/// <summary>One administrator change as the Family weekend screen lists it.</summary>
public sealed record WeekendChangeDto(
    Guid Id,
    DateTimeOffset OccurredAt,
    Guid AdminId,
    string AdminEmail,
    Guid WeekendId,
    DateOnly WeekendOf,
    string Action,
    string? Day,
    Guid? BlockId,
    string? Before,
    string? After,
    string Summary);

public sealed record WeekendChangePageDto(IReadOnlyList<WeekendChangeDto> Items, int Total, int Page, int PageSize);
