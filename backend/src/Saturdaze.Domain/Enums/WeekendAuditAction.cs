namespace Saturdaze.Domain.Enums;

/// <summary>What an administrator did to a family's weekend (L2-161). Persisted as an int; values are stable.</summary>
public enum WeekendAuditAction
{
    Plan = 1,
    Regenerate = 2,
    RegenerateDay = 3,
    LockDay = 4,
    UnlockDay = 5,
    LockBlock = 6,
    UnlockBlock = 7,
    Swap = 8
}
