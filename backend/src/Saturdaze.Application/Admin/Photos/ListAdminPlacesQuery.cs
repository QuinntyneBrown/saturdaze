using FluentValidation;
using MediatR;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>
/// The catalog places across the three catalogs for the admin Places screen (L2-113):
/// <paramref name="Q"/> is a case-insensitive name search, <paramref name="Kind"/> a
/// <see cref="PlaceKind"/> name, <paramref name="Flag"/> one of <see cref="PhotoHealth.All"/>,
/// <paramref name="Source"/> the primary photo's <see cref="PhotoSource"/>, <paramref name="Upcoming"/>
/// keeps only events starting today or later, <paramref name="Sort"/> is <c>health</c> (default),
/// <c>name</c> or <c>changed</c>; 50 places per <paramref name="Page"/>.
/// </summary>
public sealed record ListAdminPlacesQuery(
    string? Q = null,
    string? Kind = null,
    string? Flag = null,
    string? Source = null,
    bool Upcoming = false,
    string? Sort = null,
    int Page = 1) : IRequest<AdminPlacePageDto>
{
    public const int PageSize = 50;
    public static readonly IReadOnlyList<string> Sorts = new[] { "health", "name", "changed" };
}

public sealed class ListAdminPlacesQueryValidator : AbstractValidator<ListAdminPlacesQuery>
{
    public ListAdminPlacesQueryValidator()
    {
        RuleFor(q => q.Kind).Must(k => k is null || Enum.TryParse<PlaceKind>(k, true, out _))
            .WithMessage("Kind must be Activity, Restaurant or LocalEvent.");
        RuleFor(q => q.Flag).Must(f => f is null || PhotoHealth.All.Contains(f))
            .WithMessage("Flag must be no-photo, blocked-url, unreviewed or missing-alt.");
        RuleFor(q => q.Source).Must(s => s is null || Enum.TryParse<PhotoSource>(s, true, out _))
            .WithMessage("Source must be Curated, Provider or Submitter.");
        RuleFor(q => q.Sort).Must(s => s is null || ListAdminPlacesQuery.Sorts.Contains(s))
            .WithMessage("Sort must be health, name or changed.");
        RuleFor(q => q.Page).GreaterThanOrEqualTo(1);
    }
}
