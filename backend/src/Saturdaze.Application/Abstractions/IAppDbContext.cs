using Microsoft.EntityFrameworkCore;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Abstractions;

public interface IAppDbContext
{
    DbSet<Family> Families { get; }
    DbSet<FamilyMember> FamilyMembers { get; }
    DbSet<FamilyInvitation> FamilyInvitations { get; }
    DbSet<Commitment> Commitments { get; }
    DbSet<Preference> Preferences { get; }
    DbSet<Activity> Activities { get; }
    DbSet<Restaurant> Restaurants { get; }
    DbSet<RestaurantVote> RestaurantVotes { get; }
    DbSet<RestaurantLock> RestaurantLocks { get; }
    DbSet<LocalEvent> LocalEvents { get; }
    DbSet<EventSubmission> EventSubmissions { get; }
    DbSet<PlacePhoto> PlacePhotos { get; }
    DbSet<RejectedPlacePhoto> RejectedPlacePhotos { get; }
    DbSet<PhotoAuditEntry> PhotoAuditEntries { get; }
    DbSet<IngestionRun> IngestionRuns { get; }
    DbSet<AgentRun> AgentRuns { get; }
    DbSet<WeekendDraft> WeekendDrafts { get; }
    DbSet<RegionResearch> RegionResearch { get; }
    DbSet<Weekend> Weekends { get; }
    DbSet<ItineraryBlock> ItineraryBlocks { get; }
    DbSet<ShoppingErrand> ShoppingErrands { get; }
    DbSet<User> Users { get; }
    DbSet<UserAvatar> UserAvatars { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<PasswordResetToken> PasswordResetTokens { get; }
    DbSet<EmailVerificationToken> EmailVerificationTokens { get; }
    DbSet<WeekendShare> WeekendShares { get; }
    DbSet<CalendarFeed> CalendarFeeds { get; }
    DbSet<CalendarConnection> CalendarConnections { get; }
    DbSet<CalendarEventLink> CalendarEventLinks { get; }
    DbSet<PlatformInvitation> PlatformInvitations { get; }
    DbSet<Prospect> Prospects { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>Forgets every pending change, e.g. after a failed save, so the next save starts clean.</summary>
    void DiscardChanges();

    /// <summary>
    /// Holds a database-wide exclusive lock on <paramref name="resource"/> until the
    /// result is disposed, so concurrent processes take turns (L2-080 AC7).
    /// </summary>
    Task<IAsyncDisposable> AcquireLockAsync(string resource, CancellationToken cancellationToken = default);
}
