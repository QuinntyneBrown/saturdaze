using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class IngestionRunConfiguration : IEntityTypeConfiguration<IngestionRun>
{
    public void Configure(EntityTypeBuilder<IngestionRun> b)
    {
        b.ToTable("IngestionRuns");
        b.HasKey(x => x.Id);
        b.Property(x => x.ErrorMessage).HasMaxLength(2000);
        // Enums persist as int (EF default), matching the rest of the model.
        b.HasIndex(x => new { x.Type, x.StartedUtc });
    }
}
