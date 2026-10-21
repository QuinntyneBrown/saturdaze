namespace Saturdaze.Application.Calendar;

/// <summary>
/// Encrypts Google refresh tokens at rest and signs the OAuth <c>state</c>
/// (ADR-021, decisions 1 and 3).
/// </summary>
public interface ICalendarTokenProtector
{
    string Protect(string refreshToken);

    /// <summary>The refresh token, or null when it cannot be decrypted (a lost key ring).</summary>
    string? Unprotect(string protectedToken);

    string CreateState(Guid userId, DateTimeOffset expiresUtc);

    /// <summary>The state's user and expiry, or null when it is not one this server issued.</summary>
    CalendarState? ReadState(string state);
}

public sealed record CalendarState(Guid UserId, DateTimeOffset ExpiresUtc);
