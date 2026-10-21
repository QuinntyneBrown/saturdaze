using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Saturdaze.Application.Abstractions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

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
    public DbSet<PlatformInvitation> PlatformInvitations => Set<PlatformInvitation>();
    public DbSet<Prospect> Prospects => Set<Prospect>();

    public void DiscardChanges() => ChangeTracker.Clear();

    public async Task<IAsyncDisposable> AcquireLockAsync(string resource, CancellationToken cancellationToken = default)
    {
        if (!Database.IsSqlServer()) return NoLock.Instance;
        // A session-owned app lock lives as long as the connection, so keep it open until release.
        await Database.OpenConnectionAsync(cancellationToken);
        await Database.ExecuteSqlInterpolatedAsync(
            $"EXEC sp_getapplock @Resource = {resource}, @LockMode = 'Exclusive', @LockOwner = 'Session', @LockTimeout = -1",
            cancellationToken);
        return new SessionLock(this, resource);
    }

    private sealed class SessionLock(AppDbContext db, string resource) : IAsyncDisposable
    {
        public async ValueTask DisposeAsync()
        {
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"EXEC sp_releaseapplock @Resource = {resource}, @LockOwner = 'Session'");
            await db.Database.CloseConnectionAsync();
        }
    }

    private sealed class NoLock : IAsyncDisposable
    {
        public static readonly NoLock Instance = new();
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // SQLite runs the tests and the e2e API (ADR-020). It cannot compare or sort
        // DateTimeOffset text, so store the UTC instant as a sortable integer, and it
        // compares text case-sensitively, so match SQL Server's case-insensitive collation.
        if (!Database.IsSqlite()) return;
        configurationBuilder.Properties<DateTimeOffset>().HaveConversion<DateTimeOffsetToBinaryConverter>();
        configurationBuilder.Properties<string>().UseCollation("NOCASE");
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        // SQLite has no identity column outside the key; an insert trigger fills it (EnsureSqliteSchemaAsync, ADR-020).
        if (Database.IsSqlite())
            modelBuilder.Entity<PhotoAuditEntry>().Property(x => x.Sequence).HasDefaultValue(0L);
    }
}
