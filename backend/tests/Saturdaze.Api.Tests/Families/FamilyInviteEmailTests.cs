// Acceptance Test
// Traces to: L2-183, L2-162, L2-126
// Description: The owner's family invite reaches the invitee as a branded email carrying the invite link.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Infrastructure.Persistence;
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

    [Fact]
    public async Task The_invite_email_names_the_family_the_inviter_and_the_member()
    {
        // Traces to: L2-183 #2
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        await NameFamily(owner, "The Browns");
        var email = NewEmail("jo");

        await Invite(owner, "Grandma Jo", email);

        var message = (await _factory.Mail.WaitForAsync(email)).Should().ContainSingle().Subject;
        var added = $"{owner.Email} added you to The Browns as Grandma Jo and invited you to sign in to Saturdaze, the family weekend planner.";
        var footer = $"Sent to {email} because {owner.Email} invited you to their family on Saturdaze.";
        foreach (var part in new[] { message.HtmlBody!, message.Body })
        {
            part.Should().Contain("Join The Browns on Saturdaze");
            part.Should().Contain(added);
            part.Should().Contain("The link works for 7 days.");
            part.Should().Contain(footer);
        }
        message.HtmlBody.Should().Contain(">Join The Browns</a>");
        message.Body.Should().Contain("See your family's weekend plans and choose your own password:");
        message.Body.Should().Contain("If you weren't expecting this, ignore this email.");
    }

    [Fact]
    public async Task Person_supplied_values_are_encoded_in_the_invite_email()
    {
        // Traces to: L2-183 #3, L2-162 #6
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        await NameFamily(owner, "<b>Smith & Co</b>");
        var email = NewEmail("jo");

        await Invite(owner, "Jo <i>& Al</i>", email);

        var html = (await _factory.Mail.WaitForAsync(email)).Should().ContainSingle().Subject.HtmlBody!;
        html.Should().Contain("&lt;b&gt;Smith &amp; Co&lt;/b&gt;");
        html.Should().Contain("Jo &lt;i&gt;&amp; Al&lt;/i&gt;");
        html.Should().NotContain("<b>").And.NotContain("<i>");
    }

    [Fact]
    public async Task A_member_added_without_sign_in_gets_no_email()
    {
        // Traces to: L2-183 #4, L2-125
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var name = $"Mae {Guid.NewGuid():N}";

        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = name, Age = 5 });
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        await Task.Delay(500);
        _factory.Mail.Sent.Should().NotContain(m => m.Body.Contains(name));
    }

    [Fact]
    public async Task An_invite_refused_because_the_email_signs_in_sends_no_email()
    {
        // Traces to: L2-183 #4, L2-126 #3
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var existing = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = "Sara", Age = 36, Email = existing.Email });
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);

        (await InvitesTo(existing.Email)).Should().BeEmpty();
    }

    [Fact]
    public async Task An_invite_refused_because_one_is_outstanding_sends_no_second_email()
    {
        // Traces to: L2-183 #4, L2-126 #4
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var email = NewEmail("sara");
        await Invite(owner, "Sara", email);
        (await _factory.Mail.WaitForAsync(email)).Should().ContainSingle();

        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = "Sara Two", Age = 36, Email = email });
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);

        (await InvitesTo(email)).Should().ContainSingle();
    }

    [Fact]
    public async Task An_invite_to_a_malformed_email_sends_no_email()
    {
        // Traces to: L2-183 #4, L2-126 #5
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var email = $"not-an-email-{Guid.NewGuid():N}";

        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = "Sara", Age = 36, Email = email });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        (await InvitesTo(email)).Should().BeEmpty();
    }

    /// <summary>Family invites that reached an address, after giving a stray one time to arrive.</summary>
    private async Task<IReadOnlyList<Saturdaze.Application.Email.EmailMessage>> InvitesTo(string address)
    {
        await Task.Delay(500);
        return _factory.Mail.To(address).Where(m => m.Subject.EndsWith(" invited you to Saturdaze", StringComparison.Ordinal)).ToList();
    }

    private async Task NameFamily(SignedInClient.Session owner, string name)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var family = await db.Families.SingleAsync(f => f.Id == owner.FamilyId);
        family.Name = name;
        await db.SaveChangesAsync();
    }

    private static async Task<JsonElement> Invite(SignedInClient.Session owner, string name, string email)
    {
        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = name, Age = 70, Email = email });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        return JsonDocument.Parse(body).RootElement.GetProperty("invite");
    }
}
