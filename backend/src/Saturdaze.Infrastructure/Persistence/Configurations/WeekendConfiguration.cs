using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class WeekendConfiguration : IEntityTypeConfiguration<Weekend>
{
    public void Configure(EntityTypeBuilder<Weekend> b)
    {
        b.ToTable("Weekends");
        b.HasKey(x => x.Id);
        b.Property(x => x.Notes).HasMaxLength(2000);
        b.Property(x => x.Title).HasMaxLength(120);
        b.Property(x => x.Rating);
        b.HasIndex(x => new { x.FamilyId, x.WeekendOf }).IsUnique();
        b.HasMany(x => x.Blocks).WithOne().HasForeignKey(x => x.WeekendId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Errands).WithOne().HasForeignKey(x => x.WeekendId).OnDelete(DeleteBehavior.Cascade);
    }
}
