using System.Text.Json;
using System.Text.Json.Serialization;

namespace Saturdaze.Cli.Seed;

internal static class SeedJsonOptions
{
    public static readonly JsonSerializerOptions Default = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };
}
