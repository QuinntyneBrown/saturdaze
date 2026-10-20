using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Families;

/// <summary>The family's own weekend commands, run inside the family's scope and recorded (L2-160, L2-161).</summary>
public sealed record RegenerateAdminFamilyWeekendCommand(Guid FamilyId, Guid WeekendId) : IRequest<WeekendDto>;

public sealed record RegenerateAdminFamilyDayCommand(Guid FamilyId, Guid WeekendId, DayOfWeekend Day) : IRequest<WeekendDto>;

public sealed record LockAdminFamilyDayCommand(Guid FamilyId, Guid WeekendId, DayOfWeekend Day, bool Locked) : IRequest<WeekendDto>;

public sealed record LockAdminFamilyBlockCommand(Guid FamilyId, Guid BlockId, bool Locked) : IRequest<WeekendDto>;

public sealed record SwapAdminFamilyBlockCommand(Guid FamilyId, Guid BlockId, IReadOnlyList<Guid>? RejectedActivityIds) : IRequest<WeekendDto>;
