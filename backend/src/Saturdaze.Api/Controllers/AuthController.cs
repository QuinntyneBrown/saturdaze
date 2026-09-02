using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Auth;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IHostEnvironment _env;

    public AuthController(IMediator mediator, IHostEnvironment env)
    {
        _mediator = mediator;
        _env = env;
    }

    public record RegisterRequest(string Email, string Password, string? FamilyName, string? HomeLocation, bool? FridayPreview = null);
    public record LoginRequest(string Email, string Password);
    public record ForgotPasswordRequest(string Email);
    public record ResetPasswordRequest(string Token, string? NewPassword, string? Password);
    public record VerifyEmailRequest(string Token);
    public record ResendVerificationRequest(string Email);
    public record RefreshRequest(string RefreshToken);
    public record LogoutRequest(string RefreshToken);

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthSuccessDto>> Register([FromBody] RegisterRequest req, CancellationToken ct)
    {
        var dto = await _mediator.Send(
            new RegisterUserCommand(req.Email, req.Password, req.FamilyName, req.HomeLocation, req.FridayPreview ?? true), ct);
        return CreatedAtAction(nameof(Me), null, dto);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthSuccessDto>> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var dto = await _mediator.Send(new LoginCommand(req.Email, req.Password), ct);
        return Ok(dto);
    }

    /// <summary>
    /// Rotates a refresh token. Anonymous: the refresh token is the credential
    /// and the access token is normally already expired when this is called.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthSuccessDto>> Refresh([FromBody] RefreshRequest req, CancellationToken ct)
    {
        var dto = await _mediator.Send(new RefreshTokenCommand(req.RefreshToken), ct);
        return Ok(dto);
    }

    /// <summary>
    /// Revokes the refresh token (sign-out). Anonymous and idempotent for the
    /// same reason as refresh; always 204 so it never leaks token existence.
    /// </summary>
    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest req, CancellationToken ct)
    {
        await _mediator.Send(new RevokeRefreshTokenCommand(req.RefreshToken), ct);
        return NoContent();
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> ForgotPassword([FromBody] ForgotPasswordRequest req, CancellationToken ct)
    {
        var dto = await _mediator.Send(new ForgotPasswordCommand(req.Email), ct);
        return Accepted(DevDelivery(dto));
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthSuccessDto>> ResetPassword([FromBody] ResetPasswordRequest req, CancellationToken ct)
    {
        var password = req.NewPassword ?? req.Password ?? string.Empty;
        return Ok(await _mediator.Send(new ResetPasswordCommand(req.Token, password), ct));
    }

    [HttpPost("verify-email")]
    [AllowAnonymous]
    public async Task<ActionResult<UserDto>> VerifyEmail([FromBody] VerifyEmailRequest req, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new VerifyEmailCommand(req.Token), ct));
    }

    [HttpPost("resend-verification")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> ResendVerification([FromBody] ResendVerificationRequest req, CancellationToken ct)
    {
        var dto = await _mediator.Send(new ResendVerificationCommand(req.Email), ct);
        return Accepted(DevDelivery(dto));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetCurrentUserQuery(), ct));
    }

    /// <summary>
    /// There is no email provider yet, so Development and the test host hand the
    /// reset / verification token back in the response. Any other environment
    /// (Staging, Production) returns an empty body.
    /// </summary>
    private object DevDelivery(AuthTokenDeliveryDto dto)
    {
        var exposeTokens = _env.IsDevelopment() || _env.IsEnvironment("Testing");
        if (!exposeTokens) return new { };
        return new { dto.Email, dto.Token, dto.ExpiresAtUtc };
    }
}
