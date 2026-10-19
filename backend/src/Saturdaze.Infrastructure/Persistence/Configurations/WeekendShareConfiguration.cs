using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class WeekendShareConfiguration : IEntityTypeConfiguration<WeekendShare>
{
    public void Configure(EntityTypeBuilder<WeekendShare> b)
    {
        b.ToTable("WeekendShares");
        b.HasKey(x => x.Id);
        b.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
        b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasIndex(x => x.WeekendId);
        b.HasOne<Weekend>().WithMany().HasForeignKey(x => x.WeekendId).OnDelete(DeleteBehavior.Cascade);
    }
}
