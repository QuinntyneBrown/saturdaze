using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class ActivityConfiguration : IEntityTypeConfiguration<Activity>
{
    public void Configure(EntityTypeBuilder<Activity> b)
    {
        b.ToTable("Activities");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(160).IsRequired();
        b.Property(x => x.Category).HasMaxLength(80).IsRequired();
        b.Property(x => x.Description).HasMaxLength(2000).IsRequired();
        b.Property(x => x.MapUrl).HasMaxLength(500).IsRequired();
        b.Property(x => x.WeatherTags).HasConversion(
            v => string.Join('|', v),
            v => v.Length == 0
                ? new List<string>()
                : v.Split('|', StringSplitOptions.RemoveEmptyEntries).ToList())
            .Metadata.SetValueComparer(new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<List<string>>(
                (a, b2) => (a ?? new()).SequenceEqual(b2 ?? new()),
                v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
                v => v.ToList()));
        b.HasIndex(x => x.Name).IsUnique();
    }
}
