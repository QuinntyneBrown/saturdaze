using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Authentication;

public interface IJwtTokenService
{
    string CreateAccessToken(User user);
    DateTimeOffset AccessTokenExpiresAt { get; }
    string CreateRawRefreshToken();
    string HashRefreshToken(string raw);
}
