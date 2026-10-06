namespace Saturdaze.Domain.Enums;

/// <summary>Where a weekend's cover comes from (L2-108). Persisted as integers.</summary>
public enum CoverSource
{
    /// <summary>Saturday's highlight photo, else Sunday's.</summary>
    Default = 0,

    /// <summary>A stop the family picked; falls back to the default once that stop is gone.</summary>
    Stop = 1,

    /// <summary>A photo the family uploaded (L2-109).</summary>
    Upload = 2
}
