using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Domain.Entities;

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
    public DbSet<Commitment> Commitments => Set<Commitment>();
    public DbSet<Preference> Preferences => Set<Preference>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<LocalEvent> LocalEvents => Set<LocalEvent>();
    public DbSet<Weekend> Weekends => Set<Weekend>();
    public DbSet<ItineraryBlock> ItineraryBlocks => Set<ItineraryBlock>();
    public DbSet<ShoppingErrand> ShoppingErrands => Set<ShoppingErrand>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Family>().HasMany(f => f.Members).WithOne().HasForeignKey(m => m.FamilyId);
        modelBuilder.Entity<Family>().HasMany(f => f.Commitments).WithOne().HasForeignKey(c => c.FamilyId);
        modelBuilder.Entity<Family>().HasMany(f => f.Preferences).WithOne().HasForeignKey(p => p.FamilyId);
        modelBuilder.Entity<Weekend>().HasMany(w => w.Blocks).WithOne().HasForeignKey(b => b.WeekendId);
        modelBuilder.Entity<Weekend>().HasMany(w => w.Errands).WithOne().HasForeignKey(e => e.WeekendId);

        modelBuilder.Entity<Activity>().Ignore(a => a.WeatherTags);
    }
}
