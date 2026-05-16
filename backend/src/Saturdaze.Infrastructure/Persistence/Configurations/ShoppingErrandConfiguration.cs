using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

public class ShoppingErrandConfiguration : IEntityTypeConfiguration<ShoppingErrand>
{
    public void Configure(EntityTypeBuilder<ShoppingErrand> b)
    {
        b.ToTable("ShoppingErrands");
        b.HasKey(x => x.Id);
        b.Property(x => x.Description).HasMaxLength(300).IsRequired();
        b.HasIndex(x => x.WeekendId);
    }
}
