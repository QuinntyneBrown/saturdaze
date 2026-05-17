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

    public AuthController(IMediator mediator) { _mediator = mediator; }

    public record RegisterRequest(string Email, string Password, string? FamilyName, string? HomeLocation);
    public record LoginRequest(string Email, string Password);

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthSuccessDto>> Register([FromBody] RegisterRequest req, CancellationToken ct)
    {
        var dto = await _mediator.Send(
            new RegisterUserCommand(req.Email, req.Password, req.FamilyName, req.HomeLocation), ct);
        return CreatedAtAction(nameof(Me), null, dto);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthSuccessDto>> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var dto = await _mediator.Send(new LoginCommand(req.Email, req.Password), ct);
        return Ok(dto);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetCurrentUserQuery(), ct));
    }
}
