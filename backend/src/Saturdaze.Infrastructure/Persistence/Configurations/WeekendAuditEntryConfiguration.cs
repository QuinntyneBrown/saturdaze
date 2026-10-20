using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class WeekendAuditEntryConfiguration : IEntityTypeConfiguration<WeekendAuditEntry>
{
    public void Configure(EntityTypeBuilder<WeekendAuditEntry> b)
    {
        b.ToTable("WeekendAuditEntries");
        b.HasKey(x => x.Id);
        b.Property(x => x.Sequence).ValueGeneratedOnAdd().UseIdentityColumn();
        b.Property(x => x.AdminEmail).HasMaxLength(256).IsRequired();
        b.Property(x => x.Before).HasMaxLength(2000);
        b.Property(x => x.After).HasMaxLength(2000);
        // The Family weekend screen lists a family's changes newest first (L2-161).
        b.HasIndex(x => new { x.FamilyId, x.Sequence }).HasDatabaseName("IX_WeekendAuditEntries_Family");
    }
}
