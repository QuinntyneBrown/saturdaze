using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class CalendarEventLinkConfiguration : IEntityTypeConfiguration<CalendarEventLink>
{
    public void Configure(EntityTypeBuilder<CalendarEventLink> b)
    {
        b.ToTable("CalendarEventLinks");
        b.HasKey(x => x.Id);
        b.Property(x => x.EventId).HasMaxLength(1024).IsRequired();
        b.Property(x => x.Fingerprint).HasMaxLength(64).IsRequired();
        b.HasIndex(x => new { x.ConnectionId, x.WeekendId, x.BlockId }).IsUnique();
        // Disconnecting forgets every event written through the connection (L2-167).
        b.HasOne<CalendarConnection>().WithMany().HasForeignKey(x => x.ConnectionId).OnDelete(DeleteBehavior.Cascade);
    }
}
