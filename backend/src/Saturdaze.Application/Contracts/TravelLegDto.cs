namespace Saturdaze.Application.Contracts;

/// <summary>
/// The drive into a block from the previous place (L2-090): minutes, kilometres, and a
/// directions link for legs over 10 minutes, built from the two coordinates only.
/// </summary>
public sealed record TravelLegDto(int Minutes, decimal DistanceKm, string? DirectionsUrl);
