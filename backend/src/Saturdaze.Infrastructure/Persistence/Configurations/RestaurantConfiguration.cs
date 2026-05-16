using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class RestaurantConfiguration : IEntityTypeConfiguration<Restaurant>
{
    public void Configure(EntityTypeBuilder<Restaurant> b)
    {
        b.ToTable("Restaurants");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(160).IsRequired();
        b.Property(x => x.Style).HasMaxLength(80).IsRequired();
        b.Property(x => x.Notes).HasMaxLength(500);
        b.HasIndex(x => new { x.Name, x.Slot }).IsUnique();
    }
}
