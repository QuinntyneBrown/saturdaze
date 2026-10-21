using System.Security.Cryptography;
using Microsoft.AspNetCore.DataProtection;
using Saturdaze.Application.Calendar;

namespace Saturdaze.Infrastructure.Calendar;

/// <summary>
/// ASP.NET Core Data Protection for calendar sync (ADR-020, decision 3): one
/// purpose encrypts refresh tokens at rest, another signs the OAuth state.
/// </summary>
public sealed class DataProtectionCalendarTokenProtector : ICalendarTokenProtector
{
    private readonly IDataProtector _tokens;
    private readonly IDataProtector _state;

    public DataProtectionCalendarTokenProtector(IDataProtectionProvider provider)
    {
        _tokens = provider.CreateProtector("Saturdaze.CalendarSync.GoogleRefreshToken.v1");
        _state = provider.CreateProtector("Saturdaze.CalendarSync.State.v1");
    }

    public string Protect(string refreshToken) => _tokens.Protect(refreshToken);

    public string? Unprotect(string protectedToken)
    {
        try
        {
            return _tokens.Unprotect(protectedToken);
        }
        catch (CryptographicException)
        {
            return null;
        }
    }

    public string CreateState(Guid userId, DateTimeOffset expiresUtc)
        => _state.Protect($"{userId:N}|{expiresUtc.ToUnixTimeSeconds()}");

    public CalendarState? ReadState(string state)
    {
        try
        {
            var parts = _state.Unprotect(state).Split('|');
            if (parts.Length != 2 || !Guid.TryParseExact(parts[0], "N", out var userId)
                || !long.TryParse(parts[1], out var seconds)) return null;
            return new CalendarState(userId, DateTimeOffset.FromUnixTimeSeconds(seconds));
        }
        catch (CryptographicException)
        {
            return null;
        }
        catch (FormatException)
        {
            return null;
        }
    }
}
