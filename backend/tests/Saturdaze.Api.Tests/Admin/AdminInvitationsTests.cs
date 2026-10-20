// Traces to: L2-157, L2-158
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Admin;

/// <summary>
/// An administrator invites prospective families by email from Saturdaze Admin
/// (L2-157) and sees and revokes what was sent (L2-158).
/// </summary>
public class AdminInvitationsTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    public AdminInvitationsTests(SaturdazeApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Sending_to_two_addresses_creates_pending_invitations_and_mails_each()
    {
        // Traces to: L2-157 #1, #7
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var (ana, ben) = (PlatformInvites.NewEmail("ana"), PlatformInvites.NewEmail("ben"));

        var invitations = await PlatformInvites.SendAsync(admin.Client, null, null, ana, ben);

        invitations.Should().HaveCount(2);
        invitations.Select(i => i.GetProperty("email").GetString()).Should().BeEquivalentTo(new[] { ana, ben });
        foreach (var invitation in invitations)
        {
            invitation.GetProperty("status").GetString().Should().Be("Pending");
            invitation.GetProperty("sampleWeekend").ValueKind.Should().Be(JsonValueKind.Null);
            invitation.GetProperty("expiresAtUtc").GetDateTimeOffset().Should().Be(_factory.Clock.UtcNow.AddDays(14));
            var token = PlatformInvites.TokenOf(invitation);
            token.Should().NotBeNullOrWhiteSpace();

            var mail = await _factory.Mail.WaitForAsync(invitation.GetProperty("email").GetString()!);
            mail.Should().ContainSingle().Which.Subject.Should().Be("You're invited to Saturdaze");
            mail[0].Body.Should().Contain(invitation.GetProperty("url").GetString());

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var stored = await db.PlatformInvitations.SingleAsync(i => i.Id == invitation.GetProperty("id").GetGuid());
            stored.TokenHash.Should().NotBe(token).And.NotBeNullOrWhiteSpace();
        }
    }

    [Fact]
    public async Task An_address_that_already_signs_in_refuses_the_whole_batch()
    {
        // Traces to: L2-157 #3
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var existing = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var fresh = PlatformInvites.NewEmail("fresh");

        var response = await admin.Client.PostAsJsonAsync("/api/admin/invitations", new { Emails = new[] { fresh, existing.Email } });
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.Conflict, body);
        PlatformInvites.CodeOf(body).Should().Be("email_in_use");
        body.Should().Contain(existing.Email);
        var list = await PlatformInvites.ListAsync(admin.Client);
        list.EnumerateArray().Any(i => i.GetProperty("email").GetString() == fresh).Should().BeFalse();
        (await _factory.Mail.WaitForAsync(fresh, timeoutMs: 500)).Should().BeEmpty();
    }

    [Fact]
    public async Task A_pending_address_cannot_be_invited_again_until_revoked()
    {
        // Traces to: L2-157 #4
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var email = PlatformInvites.NewEmail("again");
        var first = await PlatformInvites.SendOneAsync(admin.Client, email);

        var repeat = await admin.Client.PostAsJsonAsync("/api/admin/invitations", new { Emails = new[] { email } });
        var body = await repeat.Content.ReadAsStringAsync();
        repeat.StatusCode.Should().Be(HttpStatusCode.Conflict, body);
        PlatformInvites.CodeOf(body).Should().Be("already_invited");

        (await admin.Client.DeleteAsync($"/api/admin/invitations/{first.GetProperty("id").GetGuid()}"))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);
        var second = await PlatformInvites.SendOneAsync(admin.Client, email);
        second.GetProperty("id").GetGuid().Should().NotBe(first.GetProperty("id").GetGuid());
    }

    [Theory]
    [InlineData("none")]
    [InlineData("too-many")]
    [InlineData("duplicate")]
    [InlineData("malformed")]
    [InlineData("unknown-prospect")]
    public async Task Malformed_batches_are_refused(string shape)
    {
        // Traces to: L2-157 #5
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var one = PlatformInvites.NewEmail("valid");
        object payload = shape switch
        {
            "none" => new { Emails = Array.Empty<string>() },
            "too-many" => new { Emails = Enumerable.Range(0, 21).Select(_ => PlatformInvites.NewEmail("many")).ToArray() },
            "duplicate" => new { Emails = new[] { one, one.ToUpperInvariant() } },
            "malformed" => new { Emails = new[] { "not-an-email" } },
            _ => new { Emails = new[] { one }, ProspectId = Guid.NewGuid() },
        };

        var response = await admin.Client.PostAsJsonAsync("/api/admin/invitations", payload);
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        var field = shape == "unknown-prospect" ? "prospectid" : "emails";
        JsonDocument.Parse(body).RootElement.GetProperty("errors").EnumerateObject()
            .Select(p => p.Name.ToLowerInvariant()).Should().Contain(name => name.StartsWith(field));
    }

    [Fact]
    public async Task Only_administrators_send_invitations()
    {
        // Traces to: L2-157 #6
        var user = await SignedInClient.CreateAsync(_factory);
        var payload = new { Emails = new[] { PlatformInvites.NewEmail("nope") } };
        (await user.Client.PostAsJsonAsync("/api/admin/invitations", payload)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await _factory.CreateClient().PostAsJsonAsync("/api/admin/invitations", payload)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await _factory.CreateClient().GetAsync("/api/admin/invitations")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task A_mail_failure_does_not_fail_the_request()
    {
        // Traces to: L2-157 #8
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        _factory.Mail.Fail = true;
        try
        {
            var invitation = await PlatformInvites.SendOneAsync(admin.Client, PlatformInvites.NewEmail("unreachable"));
            invitation.GetProperty("status").GetString().Should().Be("Pending");
        }
        finally
        {
            _factory.Mail.Fail = false;
        }
    }

    [Fact]
    public async Task The_list_is_newest_first_with_derived_statuses()
    {
        // Traces to: L2-158 #1
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var start = _factory.Clock.Today;
        var (a, b, c, d) = (PlatformInvites.NewEmail("a"), PlatformInvites.NewEmail("b"), PlatformInvites.NewEmail("c"), PlatformInvites.NewEmail("d"));
        try
        {
            await PlatformInvites.SendOneAsync(admin.Client, a);
            _factory.Clock.Today = start.AddDays(2);
            var bInvite = await PlatformInvites.SendOneAsync(admin.Client, b);
            _factory.Clock.TimeOfDay = TimeSpan.FromMinutes(1);
            var cInvite = await PlatformInvites.SendOneAsync(admin.Client, c);
            _factory.Clock.TimeOfDay = TimeSpan.FromMinutes(2);
            await PlatformInvites.SendOneAsync(admin.Client, d);

            (await PlatformInvites.AcceptAsync(_factory.CreateClient(), PlatformInvites.TokenOf(bInvite)))
                .StatusCode.Should().Be(HttpStatusCode.Created);
            (await admin.Client.DeleteAsync($"/api/admin/invitations/{cInvite.GetProperty("id").GetGuid()}"))
                .StatusCode.Should().Be(HttpStatusCode.NoContent);

            // 15 days after A was sent: A has expired, D (sent 2 days later) has not.
            _factory.Clock.Today = start.AddDays(15);
            _factory.Clock.TimeOfDay = TimeSpan.Zero;

            var mine = (await PlatformInvites.ListAsync(admin.Client)).EnumerateArray()
                .Where(i => new[] { a, b, c, d }.Contains(i.GetProperty("email").GetString()))
                .ToList();

            mine.Select(i => i.GetProperty("email").GetString()).Should().Equal(d, c, b, a);
            mine.Select(i => i.GetProperty("status").GetString()).Should().Equal("Pending", "Revoked", "Accepted", "Expired");
            mine[2].GetProperty("acceptedAtUtc").ValueKind.Should().NotBe(JsonValueKind.Null);
            mine[0].GetProperty("invitedByEmail").GetString().Should().Be(admin.Email);
        }
        finally
        {
            _factory.Clock.Today = start;
            _factory.Clock.TimeOfDay = TimeSpan.Zero;
        }
    }

    [Fact]
    public async Task Revoking_a_pending_invitation_kills_its_link()
    {
        // Traces to: L2-158 #2
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var invitation = await PlatformInvites.SendOneAsync(admin.Client, PlatformInvites.NewEmail("revoke"));
        var id = invitation.GetProperty("id").GetGuid();
        var token = PlatformInvites.TokenOf(invitation);

        (await admin.Client.DeleteAsync($"/api/admin/invitations/{id}")).StatusCode.Should().Be(HttpStatusCode.NoContent);

        var preview = await PlatformInvites.PreviewAsync(_factory.CreateClient(), token);
        var body = await preview.Content.ReadAsStringAsync();
        preview.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        PlatformInvites.CodeOf(body).Should().Be("token_invalid");

        PlatformInvites.Row(await PlatformInvites.ListAsync(admin.Client), invitation.GetProperty("email").GetString()!)
            .GetProperty("status").GetString().Should().Be("Revoked");
        (await admin.Client.DeleteAsync($"/api/admin/invitations/{id}")).StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task An_accepted_invitation_cannot_be_revoked_and_unknown_ids_are_404()
    {
        // Traces to: L2-158 #3
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var invitation = await PlatformInvites.SendOneAsync(admin.Client, PlatformInvites.NewEmail("accepted"));
        (await PlatformInvites.AcceptAsync(_factory.CreateClient(), PlatformInvites.TokenOf(invitation)))
            .StatusCode.Should().Be(HttpStatusCode.Created);

        var revoke = await admin.Client.DeleteAsync($"/api/admin/invitations/{invitation.GetProperty("id").GetGuid()}");
        var body = await revoke.Content.ReadAsStringAsync();
        revoke.StatusCode.Should().Be(HttpStatusCode.Conflict, body);
        PlatformInvites.CodeOf(body).Should().Be("already_accepted");

        (await admin.Client.DeleteAsync($"/api/admin/invitations/{Guid.NewGuid()}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
