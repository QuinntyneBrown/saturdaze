using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Common;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Seed;

public sealed class EventSubmissionSeeder : IJsonSeeder
{
    private readonly IDateTimeProvider _clock;

    public EventSubmissionSeeder(IDateTimeProvider clock) => _clock = clock;

    public string FileName => "event-submissions.json";

    public async Task<int> SeedAsync(AppDbContext db, Stream json, CancellationToken ct)
    {
        var envelope = await JsonSerializer.DeserializeAsync<Envelope>(
            json, SeedJsonOptions.Default, ct);
        var items = envelope?.Submissions ?? new List<SubmissionRecord>();
        if (items.Count == 0) return 0;

        var existing = await db.EventSubmissions
            .ToDictionaryAsync(s => new Key(s.Title, s.SubmittedByUserId, s.StartsAtLocal), ct);

        var written = 0;
        foreach (var record in items)
        {
            if (string.IsNullOrWhiteSpace(record.Title) ||
                string.IsNullOrWhiteSpace(record.SubmitterEmail))
                continue;

            var submitter = await db.Users
                .FirstOrDefaultAsync(u => u.NormalizedEmail == record.SubmitterEmail.ToLowerInvariant(), ct);
            if (submitter is null) continue;

            var key = new Key(record.Title, submitter.Id, record.StartsAtLocal);
            if (!existing.TryGetValue(key, out var entity))
            {
                entity = new EventSubmission
                {
                    Id = Guid.NewGuid(),
                    Title = record.Title,
                    StartsAtLocal = record.StartsAtLocal,
                    SubmittedByUserId = submitter.Id,
                };
                db.EventSubmissions.Add(entity);
                existing[key] = entity;
            }

            entity.EndsAtLocal = record.EndsAtLocal;
            entity.Location = record.Location;
            entity.Description = record.Description;
            entity.CostNote = record.CostNote;
            entity.AgeRange = record.AgeRange;
            entity.SourceUrl = record.SourceUrl;
            entity.Category = record.Category;
            entity.DriveMinutes = record.DriveMinutes;
            entity.Status = EventSubmissionStatus.Pending;
            entity.SubmittedAtUtc = _clock.UtcNow.AddHours(-record.SubmittedHoursAgo);
            written++;
        }

        return written;
    }

    private sealed record Key(string Title, Guid SubmittedByUserId, DateTime StartsAtLocal);

    private sealed record Envelope(List<SubmissionRecord>? Submissions);

    private sealed record SubmissionRecord(
        string Title,
        string SubmitterEmail,
        DateTime StartsAtLocal,
        DateTime? EndsAtLocal,
        string? Location,
        string? Description,
        string? CostNote,
        string? AgeRange,
        string? SourceUrl,
        string? Category,
        int? DriveMinutes,
        int SubmittedHoursAgo);
}
