using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class PhotoAuditEntryConfiguration : IEntityTypeConfiguration<PhotoAuditEntry>
{
    public void Configure(EntityTypeBuilder<PhotoAuditEntry> b)
    {
        b.ToTable("PhotoAuditEntries");
        b.HasKey(x => x.Id);
        b.Property(x => x.Sequence).ValueGeneratedOnAdd().UseIdentityColumn();
        b.Property(x => x.AdminEmail).HasMaxLength(256).IsRequired();
        b.Property(x => x.Before).HasMaxLength(2000);
        b.Property(x => x.After).HasMaxLength(2000);
        // The Activity log filters by place and by administrator (L2-122).
        b.HasIndex(x => new { x.PlaceKind, x.PlaceId }).HasDatabaseName("IX_PhotoAuditEntries_Place");
        b.HasIndex(x => x.AdminUserId).HasDatabaseName("IX_PhotoAuditEntries_Admin");
        b.HasIndex(x => x.OccurredAt).HasDatabaseName("IX_PhotoAuditEntries_OccurredAt");
    }
}
