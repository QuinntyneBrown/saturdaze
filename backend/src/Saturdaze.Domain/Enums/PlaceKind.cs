namespace Saturdaze.Domain.Enums;

/// <summary>Which catalog a <see cref="Entities.PlacePhoto"/> belongs to. Persisted as integers.</summary>
public enum PlaceKind
{
    Activity = 1,
    Restaurant = 2,
    LocalEvent = 3
}
