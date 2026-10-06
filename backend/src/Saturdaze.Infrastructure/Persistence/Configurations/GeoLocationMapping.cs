using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

/// <summary>Maps an optional <see cref="GeoLocation"/> into nullable columns on the owner's table (L2-099).</summary>
internal static class GeoLocationMapping
{
    public static void OwnsGeo<T>(this EntityTypeBuilder<T> b, Expression<Func<T, GeoLocation?>> nav, string prefix = "")
        where T : class
    {
        b.OwnsOne(nav, g =>
        {
            g.Property(x => x.Latitude).HasColumnName(prefix + "Latitude").HasPrecision(9, 6);
            g.Property(x => x.Longitude).HasColumnName(prefix + "Longitude").HasPrecision(9, 6);
            g.Property(x => x.Address).HasColumnName(prefix + "Address").HasMaxLength(300);
        });
        b.Navigation(nav!).IsRequired(false);
    }
}
