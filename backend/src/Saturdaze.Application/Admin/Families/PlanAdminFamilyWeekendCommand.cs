using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Admin.Families;

/// <summary>Plans the family's upcoming Saturday; idempotent like the family's own plan (L2-159 AC2).</summary>
public sealed record PlanAdminFamilyWeekendCommand(Guid FamilyId) : IRequest<WeekendDto>;
