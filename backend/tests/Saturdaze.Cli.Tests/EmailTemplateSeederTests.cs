// Acceptance Test
// Traces to: L2-124
// Description: saturdaze seed creates the two system email templates when missing and never overwrites one that exists.
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Common;
using Saturdaze.Cli.Seed;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class EmailTemplateSeederTests
{
    private static readonly string BundledFile =
        Path.Combine(AppContext.BaseDirectory, "Seed", "Data", "email-templates.json");

    private static EmailTemplateSeeder CreateSut() => new(new SystemDateTimeProvider());

    private static Stream Bundled() => File.OpenRead(BundledFile);

    [Fact]
    public void FileName_is_email_templates_json() => CreateSut().FileName.Should().Be("email-templates.json");

    [Fact]
    public async Task Seed_creates_the_system_templates_active_at_version_1()
    {
        // Traces to: L2-124 AC1
        using var db = TestDb.Create();

        await CreateSut().SeedAsync(db, Bundled(), default);
        await db.SaveChangesAsync();

        var verify = await db.EmailTemplates.SingleAsync(t => t.Key == "account.verify-email");
        verify.Name.Should().Be("Verify your email");
        verify.Status.Should().Be(EmailTemplateStatus.Active);
        verify.Category.Should().Be(EmailTemplateCategory.Account);
        verify.IsSystem.Should().BeTrue();
        verify.Version.Should().Be(1);
        verify.HtmlBody.Should().Contain("{{verificationLink}}");
        verify.TextBody.Should().Contain("{{verificationLink}}");

        var reset = await db.EmailTemplates.SingleAsync(t => t.Key == "account.password-reset");
        reset.Name.Should().Be("Reset your password");
        reset.Status.Should().Be(EmailTemplateStatus.Active);
        reset.IsSystem.Should().BeTrue();
        reset.HtmlBody.Should().Contain("{{resetLink}}");
        reset.TextBody.Should().Contain("{{resetLink}}");

        (await db.EmailTemplateRevisions.CountAsync(r => r.TemplateId == reset.Id && r.Version == 1)).Should().Be(1);
    }

    [Fact]
    public async Task Seed_keeps_an_administrators_edit()
    {
        // Traces to: L2-124 AC2
        using var db = TestDb.Create();
        await CreateSut().SeedAsync(db, Bundled(), default);
        await db.SaveChangesAsync();

        var reset = await db.EmailTemplates.SingleAsync(t => t.Key == "account.password-reset");
        reset.Subject = "Your new reset link";
        reset.Version = 5;
        await db.SaveChangesAsync();

        await CreateSut().SeedAsync(db, Bundled(), default);
        await db.SaveChangesAsync();

        var after = await db.EmailTemplates.SingleAsync(t => t.Key == "account.password-reset");
        after.Subject.Should().Be("Your new reset link");
        after.Version.Should().Be(5);
    }

    [Fact]
    public async Task Seeding_twice_leaves_one_template_per_key()
    {
        // Traces to: L2-124 AC3
        using var db = TestDb.Create();
        await CreateSut().SeedAsync(db, Bundled(), default);
        await db.SaveChangesAsync();
        await CreateSut().SeedAsync(db, Bundled(), default);
        await db.SaveChangesAsync();

        (await db.EmailTemplates.CountAsync(t => t.Key == "account.verify-email")).Should().Be(1);
        (await db.EmailTemplates.CountAsync(t => t.Key == "account.password-reset")).Should().Be(1);
    }
}
