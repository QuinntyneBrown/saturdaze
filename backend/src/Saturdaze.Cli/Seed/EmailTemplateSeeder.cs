using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Admin.EmailTemplates;
using Saturdaze.Application.Common;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Seed;

/// <summary>
/// Creates the system email templates (L2-130) from <c>email-templates.json</c>: each key that is
/// missing becomes an <c>Active</c> system template at version 1 with its first revision. A template
/// that exists is never changed, so an administrator's edits survive every <c>saturdaze seed</c>.
/// </summary>
public sealed class EmailTemplateSeeder : IJsonSeeder
{
    /// <summary>Who the seeder's templates and revisions name as their author.</summary>
    public const string Author = "Saturdaze";

    private readonly IDateTimeProvider _clock;

    public EmailTemplateSeeder(IDateTimeProvider clock) => _clock = clock;

    public string FileName => "email-templates.json";

    public async Task<int> SeedAsync(AppDbContext db, Stream json, CancellationToken ct)
    {
        var records = await JsonSerializer.DeserializeAsync<List<EmailTemplateRecord>>(json, SeedJsonOptions.Default, ct);
        if (records is null || records.Count == 0) return 0;

        var now = _clock.UtcNow.ToUniversalTime();
        var written = 0;
        foreach (var record in records)
        {
            if (string.IsNullOrWhiteSpace(record.Key)) continue;
            var key = record.Key.Trim();
            if (db.EmailTemplates.Local.Any(t => t.Key == key) || await db.EmailTemplates.AnyAsync(t => t.Key == key, ct))
                continue;

            var template = new EmailTemplate
            {
                Id = Guid.NewGuid(),
                Key = key,
                Name = record.Name ?? key,
                Description = record.Description ?? string.Empty,
                Category = record.Category ?? EmailTemplateCategory.Account,
                Status = EmailTemplateStatus.Active,
                Subject = record.Subject ?? string.Empty,
                Preheader = record.Preheader ?? string.Empty,
                HtmlBody = record.HtmlBody ?? string.Empty,
                TextBody = record.TextBody ?? string.Empty,
                SampleData = SampleValues.Write(record.SampleData),
                IsSystem = true,
                Version = 1,
                CreatedAt = now,
                CreatedByEmail = Author,
                UpdatedAt = now,
                UpdatedByEmail = Author,
            };
            db.EmailTemplates.Add(template);
            db.EmailTemplateRevisions.Add(new EmailTemplateRevision
            {
                Id = Guid.NewGuid(),
                TemplateId = template.Id,
                Version = 1,
                Action = EmailTemplateRevisionAction.Create,
                Status = template.Status,
                Name = template.Name,
                Subject = template.Subject,
                Preheader = template.Preheader,
                HtmlBody = template.HtmlBody,
                TextBody = template.TextBody,
                SampleData = template.SampleData,
                OccurredAt = now,
                AdminEmail = Author,
            });
            written++;
        }
        return written;
    }

    private sealed record EmailTemplateRecord(
        string? Key,
        string? Name,
        string? Description,
        EmailTemplateCategory? Category,
        string? Subject,
        string? Preheader,
        string? HtmlBody,
        string? TextBody,
        JsonElement? SampleData);
}
