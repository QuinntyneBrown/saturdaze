using FluentValidation;
using MediatR;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>The Activity log, newest first (L2-122): optionally one place (<paramref name="Kind"/> + <paramref name="PlaceId"/>) or one administrator; 50 per page.</summary>
public sealed record ListPhotoAuditQuery(string? Kind = null, Guid? PlaceId = null, Guid? AdminId = null, int Page = 1)
    : IRequest<PhotoAuditPageDto>
{
    public const int PageSize = 50;
}

public sealed class ListPhotoAuditQueryValidator : AbstractValidator<ListPhotoAuditQuery>
{
    public ListPhotoAuditQueryValidator()
    {
        RuleFor(q => q.Kind).Must(k => k is null || Enum.TryParse<PlaceKind>(k, true, out _))
            .WithMessage("Kind must be Activity, Restaurant or LocalEvent.");
        RuleFor(q => q.Page).GreaterThanOrEqualTo(1);
    }
}
