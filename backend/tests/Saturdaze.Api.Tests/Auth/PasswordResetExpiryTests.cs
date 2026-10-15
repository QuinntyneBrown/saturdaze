// Traces to: L2-005 AC5
using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Auth;

/// <summary>
/// A password-reset link is valid for 60 minutes (L2-005 AC5): accepted just
/// inside the window, rejected just past it. The reset-password screens quote
/// the same figure, so a change here must change that copy too.
/// </summary>
public class PasswordResetExpiryTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    public PasswordResetExpiryTests(SaturdazeApiFactory factory) => _factory = factory;

    private record DeliveryDto(string? Email, string? Token, DateTimeOffset? ExpiresAtUtc);
    private record AuthError(string Code, string Message);

    private async Task<DeliveryDto> RequestResetAsync(HttpClient client)
    {
        var email = $"expiry-{Guid.NewGuid():N}@example.com";
        var register = await client.PostAsJsonAsync("/api/auth/register", new AuthDtos.RegisterRequest(email, "password123"));
        register.IsSuccessStatusCode.Should().BeTrue(await register.Content.ReadAsStringAsync());
        var forgot = await client.PostAsJsonAsync("/api/auth/forgot-password", new AuthDtos.ForgotPasswordRequest(email));
        return (await forgot.Content.ReadFromJsonAsync<DeliveryDto>())!;
    }

    [Fact]
    public async Task A_reset_link_is_valid_for_sixty_minutes_from_the_request()
    {
        _factory.Clock.TimeOfDay = TimeSpan.Zero;
        var delivery = await RequestResetAsync(_factory.CreateClient());

        delivery.ExpiresAtUtc.Should().Be(_factory.Clock.UtcNow.AddMinutes(60));
    }

    [Fact]
    public async Task A_reset_link_is_accepted_just_inside_the_window()
    {
        var client = _factory.CreateClient();
        _factory.Clock.TimeOfDay = TimeSpan.Zero;
        var delivery = await RequestResetAsync(client);

        _factory.Clock.TimeOfDay = TimeSpan.FromMinutes(59);
        var reset = await client.PostAsJsonAsync("/api/auth/reset-password",
            new AuthDtos.ResetPasswordRequest(delivery.Token!, "newpass123"));

        _factory.Clock.TimeOfDay = TimeSpan.Zero;
        reset.StatusCode.Should().Be(HttpStatusCode.OK, await reset.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task A_reset_link_is_rejected_just_past_the_window()
    {
        var client = _factory.CreateClient();
        _factory.Clock.TimeOfDay = TimeSpan.Zero;
        var delivery = await RequestResetAsync(client);

        _factory.Clock.TimeOfDay = TimeSpan.FromMinutes(61);
        var reset = await client.PostAsJsonAsync("/api/auth/reset-password",
            new AuthDtos.ResetPasswordRequest(delivery.Token!, "newpass123"));

        _factory.Clock.TimeOfDay = TimeSpan.Zero;
        reset.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await reset.Content.ReadFromJsonAsync<AuthError>())!.Code.Should().Be("token_expired");
    }
}
