using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class PreferenceConfiguration : IEntityTypeConfiguration<Preference>
{
    public void Configure(EntityTypeBuilder<Preference> b)
    {
        b.ToTable("Preferences");
        b.HasKey(x => x.Id);
        b.Property(x => x.Value).HasMaxLength(120).IsRequired();
        b.HasIndex(x => new { x.FamilyId, x.Kind, x.Value }).IsUnique();
    }
}
