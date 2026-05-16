using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Families;

public sealed record GetFamilyProfileQuery : IRequest<FamilyProfileDto>;
