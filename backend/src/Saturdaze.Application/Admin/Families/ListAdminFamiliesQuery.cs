using MediatR;

namespace Saturdaze.Application.Admin.Families;

/// <summary>Every family, filtered by <paramref name="Q"/> and paged (L2-157).</summary>
public sealed record ListAdminFamiliesQuery(string? Q, int Page) : IRequest<AdminFamilyPageDto>
{
    public const int PageSize = 50;
}
