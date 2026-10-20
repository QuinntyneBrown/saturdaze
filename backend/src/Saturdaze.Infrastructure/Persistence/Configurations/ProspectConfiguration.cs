using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class ProspectConfiguration : IEntityTypeConfiguration<Prospect>
{
    public void Configure(EntityTypeBuilder<Prospect> b)
    {
        b.ToTable("Prospects");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.FamilyId).IsUnique();
        b.HasIndex(x => x.WeekendId).IsUnique();
        b.HasIndex(x => x.CreatedAtUtc);
        // A prospect's family and weekend outlive nothing: remove the prospect first (ADR-019).
        b.HasOne<Family>().WithMany().HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Weekend>().WithMany().HasForeignKey(x => x.WeekendId).OnDelete(DeleteBehavior.Restrict);
    }
}
