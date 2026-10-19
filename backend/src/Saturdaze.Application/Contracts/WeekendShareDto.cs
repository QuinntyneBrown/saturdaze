namespace Saturdaze.Application.Contracts;

/// <summary>A new share link; <paramref name="Token"/> is shown once (L2-086).</summary>
public sealed record WeekendShareDto(string ShareUrl, string Token, DateTimeOffset? ExpiresAtUtc = null);
