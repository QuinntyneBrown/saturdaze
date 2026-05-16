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
        b.Property(x => x.HomeLocation).HasMaxLength(200).IsRequired();
        b.HasMany(x => x.Members).WithOne().HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Commitments).WithOne().HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Preferences).WithOne().HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
    }
}
