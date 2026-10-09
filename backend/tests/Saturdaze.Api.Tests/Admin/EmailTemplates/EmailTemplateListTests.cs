// Acceptance Test
// Traces to: L2-131
// Description: GET /api/admin/email-templates lists templates for administrators only, filtered by category, status and search.
using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Admin.EmailTemplates;

public class EmailTemplateListTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    public EmailTemplateListTests(SaturdazeApiFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (db.EmailTemplates.Any(t => t.Key == "promo.spring-sale")) return;
        var now = DateTimeOffset.UtcNow;
        db.EmailTemplates.Add(new EmailTemplate
        {
            Id = Guid.NewGuid(),
            Key = "promo.spring-sale",
            Name = "Spring sale",
            Category = EmailTemplateCategory.Marketing,
            Status = EmailTemplateStatus.Draft,
            Subject = "Spring into a weekend away",
            HtmlBody = "<p>Hi</p><a href=\"{{unsubscribeUrl}}\">Unsubscribe</a>",
            TextBody = "Hi {{unsubscribeUrl}}",
            SampleData = "{}",
            Version = 1,
            CreatedAt = now,
            CreatedByEmail = "admin@saturdaze.app",
            UpdatedAt = now,
            UpdatedByEmail = "admin@saturdaze.app",
        });
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private static List<JsonElement> Items(string body) => JsonDocument.Parse(body).RootElement.EnumerateArray().ToList();

    [Fact]
    public async Task Anonymous_is_401_and_non_admin_is_403()
    {
        // Traces to: L2-131 AC1
        var anon = await _factory.CreateClient().GetAsync("/api/admin/email-templates");
        anon.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var user = await SignedInClient.CreateAsync(_factory);
        var res = await user.Client.GetAsync("/api/admin/email-templates");
        res.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Lists_every_template_by_name_with_its_summary()
    {
        // Traces to: L2-131
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var res = await admin.Client.GetAsync("/api/admin/email-templates");
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);

        var items = Items(body);
        items.Select(i => i.GetProperty("name").GetString()).Should().BeInAscendingOrder();
        var reset = items.Single(i => i.GetProperty("key").GetString() == "account.password-reset");
        reset.GetProperty("name").GetString().Should().Be("Reset your password");
        reset.GetProperty("category").GetString().Should().Be("Account");
        reset.GetProperty("status").GetString().Should().Be("Active");
        reset.GetProperty("isSystem").GetBoolean().Should().BeTrue();
        reset.GetProperty("version").GetInt32().Should().BeGreaterThanOrEqualTo(1);
        reset.GetProperty("subject").GetString().Should().NotBeNullOrWhiteSpace();
        reset.GetProperty("updatedByEmail").GetString().Should().NotBeNull();
        reset.TryGetProperty("updatedAt", out _).Should().BeTrue();
        reset.TryGetProperty("id", out _).Should().BeTrue();
    }

    [Fact]
    public async Task Filters_by_category_status_and_search()
    {
        // Traces to: L2-131 AC2
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);

        var account = Items(await admin.Client.GetStringAsync("/api/admin/email-templates?category=Account"));
        account.Select(i => i.GetProperty("key").GetString()).Should()
            .BeEquivalentTo(new[] { "account.password-reset", "account.verify-email" });

        var drafts = Items(await admin.Client.GetStringAsync("/api/admin/email-templates?status=Draft"));
        drafts.Should().NotBeEmpty();
        drafts.Should().OnlyContain(i => i.GetProperty("status").GetString() == "Draft");
        drafts.Select(i => i.GetProperty("key").GetString()).Should().Contain("promo.spring-sale");

        var search = Items(await admin.Client.GetStringAsync("/api/admin/email-templates?q=RESET"));
        search.Select(i => i.GetProperty("key").GetString()).Should().Contain("account.password-reset");
        search.Should().OnlyContain(i =>
            i.GetProperty("name").GetString()!.Contains("reset", StringComparison.OrdinalIgnoreCase)
            || i.GetProperty("key").GetString()!.Contains("reset", StringComparison.OrdinalIgnoreCase)
            || i.GetProperty("subject").GetString()!.Contains("reset", StringComparison.OrdinalIgnoreCase));
    }

    [Theory]
    [InlineData("category=Newsletter")]
    [InlineData("status=Published")]
    public async Task Unknown_category_or_status_is_400(string query)
    {
        // Traces to: L2-131 AC3
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var res = await admin.Client.GetAsync($"/api/admin/email-templates?{query}");
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
