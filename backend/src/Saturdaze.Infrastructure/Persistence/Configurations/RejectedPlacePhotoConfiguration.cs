using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class RejectedPlacePhotoConfiguration : IEntityTypeConfiguration<RejectedPlacePhoto>
{
    public void Configure(EntityTypeBuilder<RejectedPlacePhoto> b)
    {
        b.ToTable("RejectedPlacePhotos");
        b.HasKey(x => x.Id);
        b.Property(x => x.Url).HasMaxLength(1000).IsRequired();
        b.Property(x => x.Reason).HasMaxLength(500);
        // One rejection per address per place (L2-120).
        b.HasIndex(x => new { x.PlaceKind, x.PlaceId, x.Url }).IsUnique()
            .HasDatabaseName("IX_RejectedPlacePhotos_Place_Url");
    }
}
