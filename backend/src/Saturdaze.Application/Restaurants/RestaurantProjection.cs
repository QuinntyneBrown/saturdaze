using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Restaurants;

internal static class RestaurantProjection
{
    public static RestaurantDto ToDto(
        Restaurant restaurant,
        IReadOnlyList<RestaurantVoteDto> votes,
        bool locked)
    {
        return new RestaurantDto(
            restaurant.Id,
            restaurant.Name,
            restaurant.Style,
            restaurant.Slot,
            restaurant.WifeApproved,
            restaurant.DriveMinutes,
            restaurant.Notes,
            $"https://www.google.com/search?q={Uri.EscapeDataString($"{restaurant.Name} menu")}",
            votes,
            locked);
    }
}
