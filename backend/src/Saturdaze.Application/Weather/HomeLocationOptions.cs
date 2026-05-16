namespace Saturdaze.Application.Weather;

public sealed class HomeLocationOptions
{
    public const string SectionName = "Saturdaze:HomeLocation";

    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Name { get; set; } = string.Empty;
}
