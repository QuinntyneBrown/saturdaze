using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class FamilyConfiguration : IEntityTypeConfiguration<Family>
{
    public void Configure(EntityTypeBuilder<Family> b)
    {
        b.ToTable("Families");
        b.HasKey(x => x.Id);
        b.OwnsGeo(x => x.HomeCoordinates, "Home");
        b.Property(x => x.Name).HasMaxLength(100);
        b.Property(x => x.HomeLocation).HasMaxLength(200).IsRequired();
        b.Property(x => x.FridayPreviewEnabled).HasDefaultValue(true);
        // Planning boundaries (L2-191, L2-194, L2-195); defaults keep existing families as they were.
        b.Property(x => x.MaxDriveMinutes).HasDefaultValue(120);
        b.Property(x => x.ExcludedThemes).HasMaxLength(200).AsDelimited();
        b.Property(x => x.DayStart).HasDefaultValue(new TimeOnly(9, 0));
        b.Property(x => x.SundayDinnerAtHome).HasDefaultValue(true);
        b.Property(x => x.OutingsPerDay).HasDefaultValue(2);
        b.HasMany(x => x.Members).WithOne().HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Commitments).WithOne().HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Preferences).WithOne().HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
    }
}
