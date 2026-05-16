using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Contracts;

public sealed record RestaurantDto(
    Guid Id,
    string Name,
    string Style,
    MealSlot Slot,
    bool WifeApproved,
    int DriveMinutes,
    string Notes);
