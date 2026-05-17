using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class RestaurantLockConfiguration : IEntityTypeConfiguration<RestaurantLock>
{
    public void Configure(EntityTypeBuilder<RestaurantLock> b)
    {
        b.ToTable("RestaurantLocks");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.FamilyId, x.Day, x.Slot }).IsUnique();
        b.HasOne<Restaurant>().WithMany().HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Cascade);
    }
}
