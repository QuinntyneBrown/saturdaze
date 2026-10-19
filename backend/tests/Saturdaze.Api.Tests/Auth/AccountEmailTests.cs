// Acceptance Test
// Traces to: L2-142, L2-004
// Description: Account tokens reach the account holder by email, after the response.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;
using static Saturdaze.Api.Tests.Support.AuthDtos;

namespace Saturdaze.Api.Tests.Auth;

public class AccountEmailTests : IClassFixture<SaturdazeApiFactory>
{
    private const string AppOrigin = "https://app.example.com";
    private readonly SaturdazeApiFactory _factory;

    public AccountEmailTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Mail.Fail = false;
    }

    private static string NewEmail(string prefix) => $"{prefix}-{Guid.NewGuid():N}@example.com";

    [Fact]
    public async Task Registration_emails_a_verification_link_that_verifies_the_account()
    {
        var client = _factory.CreateClient();
        var email = NewEmail("mail-register");

        var reg = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "password123"));
        reg.StatusCode.Should().Be(HttpStatusCode.Created);

        var mail = await _factory.Mail.WaitForAsync(email);
        mail.Should().ContainSingle();
        mail[0].Body.Should().Contain($"{AppOrigin}/verify-email?token=");

        var verify = await client.PostAsJsonAsync("/api/auth/verify-email",
            new VerifyEmailRequest(CapturingEmailSender.LinkToken(mail[0], "/verify-email")));
        verify.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Resending_verification_emails_a_fresh_link_and_retires_the_previous_one()
    {
        var client = _factory.CreateClient();
        var email = NewEmail("mail-resend");
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "password123"));
        var first = (await _factory.Mail.WaitForAsync(email))[0];

        var resend = await client.PostAsJsonAsync("/api/auth/resend-verification", new ResendVerificationRequest(email));
        resend.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var mail = await _factory.Mail.WaitForAsync(email, count: 2);
        mail.Should().HaveCount(2);
        var stale = await client.PostAsJsonAsync("/api/auth/verify-email",
            new VerifyEmailRequest(CapturingEmailSender.LinkToken(first, "/verify-email")));
        stale.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var fresh = await client.PostAsJsonAsync("/api/auth/verify-email",
            new VerifyEmailRequest(CapturingEmailSender.LinkToken(mail[1], "/verify-email")));
        fresh.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Forgot_password_emails_a_60_minute_reset_link_that_resets_the_password()
    {
        var client = _factory.CreateClient();
        var email = NewEmail("mail-reset");
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "password123"));
        await _factory.Mail.WaitForAsync(email);

        var forgot = await client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest(email));
        forgot.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var mail = await _factory.Mail.WaitForAsync(email, count: 2);
        var resetMail = mail.Should().ContainSingle(m => m.Body.Contains("/reset-password?token=")).Subject;
        resetMail.Body.Should().Contain($"{AppOrigin}/reset-password?token=");
        resetMail.Body.Should().Contain("The link works for 60 minutes.");

        var reset = await client.PostAsJsonAsync("/api/auth/reset-password",
            new ResetPasswordRequest(CapturingEmailSender.LinkToken(resetMail, "/reset-password"), "newpass123"));
        reset.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Forgot_password_for_an_unknown_email_sends_nothing_and_answers_alike()
    {
        var client = _factory.CreateClient();
        var known = NewEmail("mail-known");
        var unknown = NewEmail("mail-unknown");
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(known, "password123"));

        var knownRes = await client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest(known));
        var unknownRes = await client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest(unknown));

        unknownRes.StatusCode.Should().Be(knownRes.StatusCode);
        PropertyNames(await unknownRes.Content.ReadAsStringAsync())
            .Should().Equal(PropertyNames(await knownRes.Content.ReadAsStringAsync()));
        await _factory.Mail.WaitForAsync(known, count: 2);
        _factory.Mail.To(unknown).Should().BeEmpty();
    }

    [Fact]
    public async Task An_unreachable_mail_server_still_answers_and_logs_the_failure_without_the_token()
    {
        var client = _factory.CreateClient();
        var email = NewEmail("mail-down");
        _factory.Mail.Fail = true;
        try
        {
            var reg = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "password123"));
            reg.StatusCode.Should().Be(HttpStatusCode.Created);
            var forgot = await client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest(email));
            forgot.StatusCode.Should().Be(HttpStatusCode.Accepted);
            var token = (await forgot.Content.ReadFromJsonAsync<Delivery>())!.Token!;

            var deadline = DateTime.UtcNow.AddSeconds(5);
            while (DateTime.UtcNow < deadline && !_factory.Logs.Messages.Any(m => m.Contains("Email delivery failed")))
                await Task.Delay(25);

            var logs = _factory.Logs.Messages;
            logs.Should().Contain(m => m.Contains("Email delivery failed"));
            logs.Should().NotContain(m => m.Contains(token));
        }
        finally
        {
            _factory.Mail.Fail = false;
        }
    }

    private static IEnumerable<string> PropertyNames(string json) =>
        JsonDocument.Parse(json).RootElement.EnumerateObject().Select(p => p.Name).ToList();
}
