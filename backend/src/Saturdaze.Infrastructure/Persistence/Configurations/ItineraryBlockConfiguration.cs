using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class ItineraryBlockConfiguration : IEntityTypeConfiguration<ItineraryBlock>
{
    public void Configure(EntityTypeBuilder<ItineraryBlock> b)
    {
        b.ToTable("ItineraryBlocks");
        b.HasKey(x => x.Id);
        b.Property(x => x.Title).HasMaxLength(160).IsRequired();
        b.Property(x => x.Reason).HasMaxLength(500).IsRequired();
        b.HasIndex(x => new { x.WeekendId, x.Day, x.SortOrder });
    }
}
