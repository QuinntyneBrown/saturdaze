using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Seed;

public sealed class UserSeeder : IJsonSeeder
{
    private readonly IPasswordHasher _hasher;
    private readonly IDateTimeProvider _clock;

    public UserSeeder(IPasswordHasher hasher, IDateTimeProvider clock)
    {
        _hasher = hasher;
        _clock = clock;
    }

    public string FileName => "users.json";

    public async Task<int> SeedAsync(AppDbContext db, Stream json, CancellationToken ct)
    {
        var records = await JsonSerializer.DeserializeAsync<List<UserRecord>>(
            json, SeedJsonOptions.Default, ct);
        if (records is null || records.Count == 0)
            return 0;

        var now = _clock.UtcNow;
        var written = 0;

        foreach (var record in records)
        {
            if (string.IsNullOrWhiteSpace(record.Email) ||
                string.IsNullOrWhiteSpace(record.Password))
                continue;

            var email = record.Email.Trim();
            var normalized = email.ToLowerInvariant();
            var family = await ResolveFamily(db, record.FamilyHomeLocation, ct);

            var existing = db.Users.Local.FirstOrDefault(u => u.NormalizedEmail == normalized)
                ?? await db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalized, ct);

            if (existing is null)
            {
                db.Users.Add(new User
                {
                    Id = Guid.NewGuid(),
                    Email = email,
                    NormalizedEmail = normalized,
                    PasswordHash = _hasher.Hash(record.Password),
                    Role = record.Role ?? UserRole.User,
                    FamilyId = family?.Id,
                    EmailVerifiedUtc = record.EmailVerified ? now : null,
                    CreatedAtUtc = now,
                    UpdatedAtUtc = now,
                });
            }
            else
            {
                existing.Email = email;
                existing.PasswordHash = _hasher.Hash(record.Password);
                existing.Role = record.Role ?? existing.Role;
                existing.FamilyId = family?.Id ?? existing.FamilyId;
                existing.EmailVerifiedUtc = record.EmailVerified
                    ? existing.EmailVerifiedUtc ?? now
                    : existing.EmailVerifiedUtc;
                existing.UpdatedAtUtc = now;
            }

            written++;
        }

        return written;
    }

    private static async Task<Family?> ResolveFamily(
        AppDbContext db,
        string? homeLocation,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(homeLocation))
            return null;

        var local = db.Families.Local
            .FirstOrDefault(f => string.Equals(
                f.HomeLocation, homeLocation, StringComparison.OrdinalIgnoreCase));
        if (local is not null) return local;

        return await db.Families
            .FirstOrDefaultAsync(f => f.HomeLocation == homeLocation, ct);
    }

    private sealed record UserRecord(
        string Email,
        string Password,
        UserRole? Role,
        bool EmailVerified,
        string? FamilyHomeLocation);
}
