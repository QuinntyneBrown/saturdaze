using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class PlatformInvitationConfiguration : IEntityTypeConfiguration<PlatformInvitation>
{
    public void Configure(EntityTypeBuilder<PlatformInvitation> b)
    {
        b.ToTable("PlatformInvitations");
        b.HasKey(x => x.Id);
        b.Property(x => x.Email).HasMaxLength(256).IsRequired();
        b.Property(x => x.NormalizedEmail).HasMaxLength(256).IsRequired();
        b.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
        b.Property(x => x.Message).HasMaxLength(500);
        b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasIndex(x => x.NormalizedEmail);
        b.HasIndex(x => x.CreatedAtUtc);
        // An invitation keeps its prospect: remove the invitations first (ADR-019).
        b.HasOne<Prospect>().WithMany().HasForeignKey(x => x.ProspectId).OnDelete(DeleteBehavior.Restrict);
    }
}
