using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Contracts;

/// <summary>Per-day totals for the day header and map legend (L2-090 AC5, L2-091).</summary>
public sealed record DayDto(DayOfWeekend Day, int StopCount, int DrivingMinutes, decimal DrivingKm);
