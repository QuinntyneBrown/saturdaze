namespace Saturdaze.Domain.Enums;

/// <summary>Whether a family member signs in (L2-124).</summary>
public enum MemberAccess
{
    /// <summary>Planned for, never signs in (for example a young child).</summary>
    None = 0,
    /// <summary>An invitation to sign in is outstanding.</summary>
    Invited = 1,
    /// <summary>Signs in with their own credentials.</summary>
    Account = 2,
}
