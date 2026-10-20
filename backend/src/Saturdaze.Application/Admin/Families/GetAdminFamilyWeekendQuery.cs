using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Admin.Families;

/// <summary>The family's weekend for the upcoming Saturday, read without planning it (L2-159 AC1).</summary>
public sealed record GetAdminFamilyWeekendQuery(Guid FamilyId) : IRequest<WeekendDto>;
