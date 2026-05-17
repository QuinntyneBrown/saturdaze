namespace Saturdaze.Application.Contracts;

public record AuthTokensDto(
    string AccessToken,
    string RefreshToken,
    DateTimeOffset AccessTokenExpiresAtUtc,
    string TokenType = "Bearer"
);
