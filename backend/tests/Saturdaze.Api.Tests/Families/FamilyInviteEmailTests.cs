// Acceptance Test
// Traces to: L2-183, L2-162, L2-126
// Description: The owner's family invite reaches the invitee as a branded email carrying the invite link.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Families;

public class FamilyInviteEmailTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public FamilyInviteEmailTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Mail.Fail = false;
    }

    private static string NewEmail(string prefix) => $"{prefix}-{Guid.NewGuid():N}@example.com";

    [Fact]
    public async Task Inviting_a_member_emails_them_the_invite_link_on_brand()
    {
        // Traces to: L2-183 #1
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var email = NewEmail("jo");

        var invite = await Invite(owner, "Grandma Jo", email);
        var url = invite.GetProperty("url").GetString()!;

        var mail = await _factory.Mail.WaitForAsync(email);
        var message = mail.Should().ContainSingle().Subject;
        message.Subject.Should().Be($"{owner.Email} invited you to Saturdaze");
        message.HtmlBody.Should().NotBeNull();
        message.HtmlBody.Should().Contain($"<title>{owner.Email} invited you to Saturdaze</title>");
        message.HtmlBody.Should().Contain("href=\"" + url + "\"");
        message.HtmlBody.Should().Contain("#bf5130").And.Contain("#1f2937").And.Contain("#faf7f2");
        message.Body.Should().Contain(url);

        var accept = await _factory.CreateClient().PostAsJsonAsync("/api/auth/accept-invitation",
            new { Token = CapturingEmailSender.LinkToken(message, "/accept-invite"), Password = SignedInClient.Password });
        accept.StatusCode.Should().Be(HttpStatusCode.Created, await accept.Content.ReadAsStringAsync());
    }

    private static async Task<JsonElement> Invite(SignedInClient.Session owner, string name, string email)
    {
        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = name, Age = 70, Email = email });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        return JsonDocument.Parse(body).RootElement.GetProperty("invite");
    }
}
