namespace Saturdaze.Api.Tests.Support;

/// <summary>
/// Wire shapes for the auth endpoints, shared by every API test that registers
/// or signs in. Deliberately independent of the Application contracts so a
/// contract change shows up as a failing test rather than a silent rename.
/// </summary>
internal static class AuthDtos
{
    public record RegisterRequest(string Email, string Password, string? FamilyName = null, string? HomeLocation = null);
    public record LoginRequest(string Email, string Password);
    public record RefreshRequest(string RefreshToken);
    public record LogoutRequest(string RefreshToken);
    public record ForgotPasswordRequest(string Email);
    public record ResetPasswordRequest(string Token, string Password);
    public record VerifyEmailRequest(string Token);
    public record ResendVerificationRequest(string Email);

    public record Token(string AccessToken, string RefreshToken, DateTimeOffset AccessTokenExpiresAtUtc, string TokenType);
    public record User(Guid Id, string Email, string Role, DateTimeOffset? EmailVerifiedUtc);
    public record AuthSuccess(Token Token, User User);
    public record Delivery(string? Email, string? Token, DateTimeOffset? ExpiresAtUtc);
    public record Error(string Code, string Message);
}
