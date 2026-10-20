using MediatR;

namespace Saturdaze.Application.Admin.Families;

/// <summary>One family with its members and commitments (L2-159); 404 when unknown.</summary>
public sealed record GetAdminFamilyQuery(Guid FamilyId) : IRequest<AdminFamilyDetailDto>;
