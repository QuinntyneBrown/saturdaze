using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Saturdaze.Infrastructure.Persistence.Configurations;

/// <summary>Stores a short list in one column, '|'-separated, as <c>Activity.WeatherTags</c> does.</summary>
internal static class ListMapping
{
    public static PropertyBuilder<List<string>> AsDelimited(this PropertyBuilder<List<string>> p)
    {
        p.HasConversion(
                v => string.Join('|', v),
                v => v.Length == 0 ? new List<string>() : v.Split('|', StringSplitOptions.RemoveEmptyEntries).ToList())
            .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                (a, b) => (a ?? new()).SequenceEqual(b ?? new()),
                v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
                v => v.ToList()));
        return p;
    }

    public static PropertyBuilder<List<Guid>> AsDelimited(this PropertyBuilder<List<Guid>> p)
    {
        p.HasConversion(
                v => string.Join('|', v),
                v => v.Length == 0 ? new List<Guid>() : v.Split('|', StringSplitOptions.RemoveEmptyEntries).Select(Guid.Parse).ToList())
            .Metadata.SetValueComparer(new ValueComparer<List<Guid>>(
                (a, b) => (a ?? new()).SequenceEqual(b ?? new()),
                v => v.Aggregate(0, (h, g) => HashCode.Combine(h, g.GetHashCode())),
                v => v.ToList()));
        return p;
    }
}
