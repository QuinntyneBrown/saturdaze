namespace Saturdaze.Domain.Enums;

/// <summary>What an administrator did to a place photo (L2-122). Persisted as an int; values are stable.</summary>
public enum PhotoAuditAction
{
    Upload = 1,
    AddUrl = 2,
    Edit = 3,
    Primary = 4,
    Remove = 5,
    Review = 6
}
