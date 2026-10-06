using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class PlacePhotoConfiguration : IEntityTypeConfiguration<PlacePhoto>
{
    public void Configure(EntityTypeBuilder<PlacePhoto> b)
    {
        b.ToTable("PlacePhotos");
        b.HasKey(x => x.Id);
        b.Property(x => x.Url).HasMaxLength(1000).IsRequired();
        b.Property(x => x.AltText).HasMaxLength(300).IsRequired();
        b.Property(x => x.Attribution).HasMaxLength(300).IsRequired();
        b.Property(x => x.License).HasMaxLength(120).IsRequired();
        b.Property(x => x.StorageKey).HasMaxLength(100);
        b.HasIndex(x => new { x.PlaceKind, x.PlaceId }).HasDatabaseName("IX_PlacePhotos_Place");
        // L2-100: at most one primary photo per place, enforced by the database too.
        b.HasIndex(x => new { x.PlaceKind, x.PlaceId })
            .IsUnique()
            .HasFilter("[IsPrimary] = 1")
            .HasDatabaseName("IX_PlacePhotos_Primary");
    }
}
