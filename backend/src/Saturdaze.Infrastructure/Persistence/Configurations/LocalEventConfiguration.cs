using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class LocalEventConfiguration : IEntityTypeConfiguration<LocalEvent>
{
    public void Configure(EntityTypeBuilder<LocalEvent> b)
    {
        b.ToTable("LocalEvents");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Property(x => x.Location).HasMaxLength(200).IsRequired();
        b.Property(x => x.Url).HasMaxLength(500);
        b.Property(x => x.Category).HasMaxLength(80).IsRequired();
        // Natural key the ingestion upserter dedupes on: a venue can run two
        // differently-located events with the same name on the same date.
        b.HasIndex(x => new { x.Name, x.StartsOn, x.Location }).IsUnique();
        b.HasIndex(x => x.StartsOn);
    }
}
