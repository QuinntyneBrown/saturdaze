using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Family> Families => Set<Family>();
    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
    public DbSet<Commitment> Commitments => Set<Commitment>();
    public DbSet<Preference> Preferences => Set<Preference>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<RestaurantVote> RestaurantVotes => Set<RestaurantVote>();
    public DbSet<RestaurantLock> RestaurantLocks => Set<RestaurantLock>();
    public DbSet<LocalEvent> LocalEvents => Set<LocalEvent>();
    public DbSet<EventSubmission> EventSubmissions => Set<EventSubmission>();
    public DbSet<Weekend> Weekends => Set<Weekend>();
    public DbSet<ItineraryBlock> ItineraryBlocks => Set<ItineraryBlock>();
    public DbSet<ShoppingErrand> ShoppingErrands => Set<ShoppingErrand>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
