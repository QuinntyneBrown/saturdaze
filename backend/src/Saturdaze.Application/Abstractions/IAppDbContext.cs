using Microsoft.EntityFrameworkCore;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Abstractions;

public interface IAppDbContext
{
    DbSet<Family> Families { get; }
    DbSet<FamilyMember> FamilyMembers { get; }
    DbSet<Commitment> Commitments { get; }
    DbSet<Preference> Preferences { get; }
    DbSet<Activity> Activities { get; }
    DbSet<Restaurant> Restaurants { get; }
    DbSet<LocalEvent> LocalEvents { get; }
    DbSet<Weekend> Weekends { get; }
    DbSet<ItineraryBlock> ItineraryBlocks { get; }
    DbSet<ShoppingErrand> ShoppingErrands { get; }
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
