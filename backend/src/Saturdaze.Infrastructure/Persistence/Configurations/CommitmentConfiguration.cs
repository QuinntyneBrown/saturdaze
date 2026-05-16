using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class CommitmentConfiguration : IEntityTypeConfiguration<Commitment>
{
    public void Configure(EntityTypeBuilder<Commitment> b)
    {
        b.ToTable("Commitments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Title).HasMaxLength(120).IsRequired();
        b.HasIndex(x => x.FamilyId);
    }
}
