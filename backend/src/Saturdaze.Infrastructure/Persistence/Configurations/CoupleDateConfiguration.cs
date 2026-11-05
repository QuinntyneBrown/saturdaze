using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class CoupleDateConfiguration : IEntityTypeConfiguration<CoupleDate>
{
    public void Configure(EntityTypeBuilder<CoupleDate> b)
    {
        b.ToTable("CoupleDates");
        b.HasKey(x => x.Id);
        b.Property(x => x.AttendeeMemberIds).HasMaxLength(100).AsDelimited();
        b.Property(x => x.RejectedRestaurantIds).HasMaxLength(2000).AsDelimited();
        b.Property(x => x.RejectedActivityIds).HasMaxLength(2000).AsDelimited();
        b.Property(x => x.StepsJson).IsRequired();
        b.HasOne<Weekend>().WithMany().HasForeignKey(x => x.WeekendId).OnDelete(DeleteBehavior.Cascade);
        // One date per meal per day of a weekend (L2-219, ADR-025).
        b.HasIndex(x => new { x.WeekendId, x.Day, x.Meal }).IsUnique();
        b.HasIndex(x => x.FamilyId);
    }
}
