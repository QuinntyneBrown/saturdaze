// Acceptance Test
// Traces to: L2-143
// Description: Every new password needs 8 or more characters including a number or symbol.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Infrastructure.Persistence;
using Xunit;
using static Saturdaze.Api.Tests.Support.AuthDtos;

namespace Saturdaze.Api.Tests.Auth;

public class PasswordRuleTests : IClassFixture<SaturdazeApiFactory>
{
    private const string LettersOnly = "abcdefgh";
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private readonly SaturdazeApiFactory _factory;

    public PasswordRuleTests(SaturdazeApiFactory factory) => _factory = factory;

    private static string NewEmail(string prefix) => $"{prefix}-{Guid.NewGuid():N}@example.com";

    [Fact]
    public async Task Registration_refuses_a_password_without_a_number_or_symbol()
    {
        var email = NewEmail("rule-register");
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, LettersOnly));

        await ShouldBeWeak(response);
        using var scope = _factory.Services.CreateScope();
        (await scope.ServiceProvider.GetRequiredService<AppDbContext>().Users
            .AnyAsync(u => u.NormalizedEmail == email)).Should().BeFalse();
    }

    [Theory]
    [InlineData("abcdefg1")]
    [InlineData("abcdefg!")]
    public async Task Registration_accepts_a_password_with_a_number_or_symbol(string password)
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(NewEmail("rule-register-ok"), password));

        response.StatusCode.Should().Be(HttpStatusCode.Created, await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Reset_refuses_a_weak_password_and_leaves_the_link_and_password_alone()
    {
        var client = _factory.CreateClient();
        var email = NewEmail("rule-reset");
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "password123"));
        var token = await ResetToken(client, email);

        await ShouldBeWeak(await client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequest(token, LettersOnly)));

        (await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, "password123")))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequest(token, "abcdefg!")))
            .StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Invitation_acceptance_refuses_a_weak_password_and_accepts_a_compliant_one()
    {
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var invite = await owner.Client.PostAsJsonAsync("/api/family/members",
            new { Name = "Sara", Age = 36, Email = NewEmail("rule-invite") });
        var inviteBody = await invite.Content.ReadAsStringAsync();
        invite.StatusCode.Should().Be(HttpStatusCode.Created, inviteBody);
        var token = JsonDocument.Parse(inviteBody).RootElement.GetProperty("invite").GetProperty("token").GetString();

        var anonymous = _factory.CreateClient();
        await ShouldBeWeak(await anonymous.PostAsJsonAsync("/api/auth/accept-invitation", new { Token = token, Password = LettersOnly }));
        var accepted = await anonymous.PostAsJsonAsync("/api/auth/accept-invitation", new { Token = token, Password = "abcdefg1" });
        accepted.StatusCode.Should().Be(HttpStatusCode.Created, await accepted.Content.ReadAsStringAsync());
    }

    private static async Task<string> ResetToken(HttpClient client, string email)
    {
        var forgot = await client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest(email));
        return (await forgot.Content.ReadFromJsonAsync<Delivery>())!.Token!;
    }

    private static async Task ShouldBeWeak(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        JsonSerializer.Deserialize<Error>(body, Json)!.Code.Should().Be("weak_password");
    }
}
