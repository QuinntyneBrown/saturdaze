using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Tests.Support;

/// <summary>
/// In-memory DbContext for handler unit tests. Implements IAppDbContext directly
/// so Application code under test never sees Infrastructure.
/// </summary>
internal sealed class TestAppDbContext : DbContext, IAppDbContext
{
    public TestAppDbContext(DbContextOptions<TestAppDbContext> options) : base(options) { }

    public DbSet<Family> Families => Set<Family>();
    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
    public DbSet<FamilyInvitation> FamilyInvitations => Set<FamilyInvitation>();
    public DbSet<Commitment> Commitments => Set<Commitment>();
    public DbSet<Preference> Preferences => Set<Preference>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<RestaurantVote> RestaurantVotes => Set<RestaurantVote>();
    public DbSet<RestaurantLock> RestaurantLocks => Set<RestaurantLock>();
    public DbSet<LocalEvent> LocalEvents => Set<LocalEvent>();
    public DbSet<EventSubmission> EventSubmissions => Set<EventSubmission>();
    public DbSet<PlacePhoto> PlacePhotos => Set<PlacePhoto>();
    public DbSet<RejectedPlacePhoto> RejectedPlacePhotos => Set<RejectedPlacePhoto>();
    public DbSet<PhotoAuditEntry> PhotoAuditEntries => Set<PhotoAuditEntry>();
    public DbSet<IngestionRun> IngestionRuns => Set<IngestionRun>();
    public DbSet<Weekend> Weekends => Set<Weekend>();
    public DbSet<ItineraryBlock> ItineraryBlocks => Set<ItineraryBlock>();
    public DbSet<ShoppingErrand> ShoppingErrands => Set<ShoppingErrand>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserAvatar> UserAvatars => Set<UserAvatar>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();
    public DbSet<WeekendShare> WeekendShares => Set<WeekendShare>();
    public DbSet<CalendarFeed> CalendarFeeds => Set<CalendarFeed>();
    public DbSet<CalendarConnection> CalendarConnections => Set<CalendarConnection>();
    public DbSet<CalendarEventLink> CalendarEventLinks => Set<CalendarEventLink>();
    public DbSet<PlatformInvitation> PlatformInvitations => Set<PlatformInvitation>();
    public DbSet<Prospect> Prospects => Set<Prospect>();

    /// <summary>When set, the save with this 1-based number throws, as a failed commit would.</summary>
    public int? FailOnSave { get; set; }
    public int Saves { get; private set; }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        Saves++;
        if (FailOnSave == Saves) throw new DbUpdateException("Simulated save failure.");
        return base.SaveChangesAsync(cancellationToken);
    }

    public void DiscardChanges() => ChangeTracker.Clear();

    public Task<IAsyncDisposable> AcquireLockAsync(string resource, CancellationToken cancellationToken = default)
        => Task.FromResult<IAsyncDisposable>(new NoLock());

    private sealed class NoLock : IAsyncDisposable
    {
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Owned<GeoLocation>();
        modelBuilder.Entity<Family>().HasMany(f => f.Members).WithOne().HasForeignKey(m => m.FamilyId);
        modelBuilder.Entity<Family>().HasMany(f => f.Commitments).WithOne().HasForeignKey(c => c.FamilyId);
        modelBuilder.Entity<Family>().HasMany(f => f.Preferences).WithOne().HasForeignKey(p => p.FamilyId);
        modelBuilder.Entity<Weekend>().HasMany(w => w.Blocks).WithOne().HasForeignKey(b => b.WeekendId);
        modelBuilder.Entity<Weekend>().HasMany(w => w.Errands).WithOne().HasForeignKey(e => e.WeekendId);
        modelBuilder.Entity<UserAvatar>().HasKey(a => a.UserId);
        modelBuilder.Entity<PhotoAuditEntry>().Property(e => e.Sequence).ValueGeneratedOnAdd();
    }
}
