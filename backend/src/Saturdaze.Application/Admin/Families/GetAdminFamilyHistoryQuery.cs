using MediatR;
using Saturdaze.Application.Weekends;

namespace Saturdaze.Application.Admin.Families;

/// <summary>The family's past weekends, newest first (L2-159 AC6).</summary>
public sealed record GetAdminFamilyHistoryQuery(Guid FamilyId, int Take = 20) : IRequest<WeekendHistoryPage>;
