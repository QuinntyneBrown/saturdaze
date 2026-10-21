using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class CalendarConnectionConfiguration : IEntityTypeConfiguration<CalendarConnection>
{
    public void Configure(EntityTypeBuilder<CalendarConnection> b)
    {
        b.ToTable("CalendarConnections");
        b.HasKey(x => x.Id);
        b.Property(x => x.GoogleSubject).HasMaxLength(64).IsRequired();
        b.Property(x => x.Email).HasMaxLength(320).IsRequired();
        b.Property(x => x.ProtectedRefreshToken).IsRequired();
        b.Property(x => x.Status).HasConversion<int>();
        b.HasIndex(x => x.UserId).IsUnique();
        b.HasIndex(x => new { x.Status, x.SyncRequestCount, x.SyncedRequestCount });
        // A removed member's account takes its connection with it (L2-181 AC5).
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
