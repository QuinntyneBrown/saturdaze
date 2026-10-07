using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Families;

public sealed class SaveFamilyProfileCommandHandler : IRequestHandler<SaveFamilyProfileCommand, FamilyProfileDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;
    private readonly FamilyProfileReader _reader;
    private readonly FamilyOwnership _ownership;

    public SaveFamilyProfileCommandHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        ICurrentUserAccessor user,
        IDateTimeProvider clock,
        FamilyProfileReader reader,
        FamilyOwnership ownership)
    {
        _db = db;
        _current = current;
        _user = user;
        _clock = clock;
        _reader = reader;
        _ownership = ownership;
    }

    public async Task<FamilyProfileDto> Handle(SaveFamilyProfileCommand request, CancellationToken cancellationToken)
    {
        Guid? familyId = null;
        try
        {
            familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);
        }
        catch (NotFoundException)
        {
            // First-time setup: the account has no family yet. (An
            // unauthenticated caller throws InvalidCredentialsException, which
            // is deliberately not caught here.)
        }

        var family = familyId is { } id
            ? await _db.Families
                .Include(f => f.Members)
                .Include(f => f.Commitments)
                .Include(f => f.Preferences)
                .SingleOrDefaultAsync(f => f.Id == id, cancellationToken)
            : null;

        // Only the owner changes who's in (L2-129 #1); everyone saves the rest.
        if (family is not null && !_ownership.IsOwner(family) && MembersChange(family.Members, request.Members))
            throw new ForbiddenException("owner_only", "Only the family's owner can change who's in.");

        if (family is null)
        {
            var userId = _user.UserId
                ?? throw new InvalidCredentialsException("unauthenticated", "Sign in to continue.");
            var owner = await _db.Users.SingleOrDefaultAsync(u => u.Id == userId, cancellationToken)
                ?? throw new InvalidCredentialsException("unauthenticated", "Sign in to continue.");

            family = new Family { Id = Guid.NewGuid(), OwnerUserId = owner.Id };
            _db.Families.Add(family);
            owner.FamilyId = family.Id;
            owner.UpdatedAtUtc = _clock.UtcNow;
        }

        family.HomeLocation = request.HomeLocation;
        family.BudgetEnabled = request.BudgetEnabled;
        if (request.Name is not null) family.Name = string.IsNullOrWhiteSpace(request.Name) ? null : request.Name.Trim();
        if (request.TryNewEnabled is { } tryNew) family.TryNewEnabled = tryNew;
        if (request.FridayPreviewEnabled is { } friday) family.FridayPreviewEnabled = friday;

        var withAccess = await MembersWithAccessAsync(family, cancellationToken);
        SyncMembers(family, request.Members, withAccess);
        SyncCommitments(family, request.Commitments);
        SyncPreferences(family, request.Preferences);

        await _db.SaveChangesAsync(cancellationToken);

        // Re-read so the response reflects exactly what was persisted, without
        // depending on the family accessor having seen a family that was created
        // a moment ago.
        return (await _reader.ReadAsync(family.Id, cancellationToken))!;
    }

    // NOTE: each sync snapshots the existing rows first. EF fixes up the
    // navigation as soon as a new child is Added, so iterating the live
    // collection during the removal pass would delete the rows just added.

    private static bool MembersChange(IEnumerable<FamilyMember> existing, IReadOnlyList<SaveMemberInput> requested)
    {
        static IEnumerable<string> Keys(IEnumerable<(string Name, int Age)> members) =>
            members.Select(m => $"{m.Name.Trim().ToLowerInvariant()}|{m.Age}").Order(StringComparer.Ordinal);
        return !Keys(existing.Select(m => (m.Name, m.Age))).SequenceEqual(Keys(requested.Select(m => (m.Name, m.Age))));
    }

    /// <summary>Members who are invited or sign in; removing them goes through DELETE (L2-129 #3).</summary>
    private async Task<HashSet<Guid>> MembersWithAccessAsync(Family family, CancellationToken ct)
    {
        var invited = await _db.FamilyInvitations
            .Where(i => i.FamilyId == family.Id && i.AcceptedAtUtc == null)
            .Select(i => i.FamilyMemberId)
            .ToListAsync(ct);
        return family.Members.Where(m => m.UserId is not null).Select(m => m.Id).Concat(invited).ToHashSet();
    }

    private void SyncMembers(Family family, IReadOnlyList<SaveMemberInput> inputs, IReadOnlySet<Guid> withAccess)
    {
        var existing = family.Members.ToList();
        var byId = existing.ToDictionary(m => m.Id);
        var byName = existing.ToDictionary(m => m.Name, StringComparer.OrdinalIgnoreCase);
        var matched = new HashSet<Guid>();

        foreach (var input in inputs)
        {
            FamilyMember? member = null;
            if (input.Id is { } id && byId.TryGetValue(id, out var byIdMatch))
                member = byIdMatch;
            else if (byName.TryGetValue(input.Name, out var byNameMatch) && !matched.Contains(byNameMatch.Id))
                member = byNameMatch;

            if (member is null)
            {
                _db.FamilyMembers.Add(new FamilyMember
                {
                    Id = Guid.NewGuid(),
                    FamilyId = family.Id,
                    Name = input.Name,
                    Age = input.Age
                });
                continue;
            }

            matched.Add(member.Id);
            member.Name = input.Name;
            member.Age = input.Age;
        }

        var dropped = existing.Where(m => !matched.Contains(m.Id)).ToList();
        if (dropped.Any(m => withAccess.Contains(m.Id)))
            throw new ConflictException("member_has_access", "Remove a member who is invited or signs in from the family page.");

        foreach (var member in dropped)
            _db.FamilyMembers.Remove(member);
    }

    private void SyncCommitments(Family family, IReadOnlyList<SaveCommitmentInput> inputs)
    {
        var existing = family.Commitments.ToList();
        var byId = existing.ToDictionary(c => c.Id);
        var byKey = existing.ToDictionary(c => (c.Title.ToLowerInvariant(), c.DayOfWeek));
        var matched = new HashSet<Guid>();

        foreach (var input in inputs)
        {
            Commitment? commitment = null;
            if (input.Id is { } id && byId.TryGetValue(id, out var byIdMatch))
                commitment = byIdMatch;
            else if (byKey.TryGetValue((input.Title.ToLowerInvariant(), input.DayOfWeek), out var byKeyMatch)
                     && !matched.Contains(byKeyMatch.Id))
                commitment = byKeyMatch;

            if (commitment is null)
            {
                _db.Commitments.Add(new Commitment
                {
                    Id = Guid.NewGuid(),
                    FamilyId = family.Id,
                    Title = input.Title,
                    DayOfWeek = input.DayOfWeek,
                    StartTime = input.StartTime,
                    EndTime = input.EndTime
                });
                continue;
            }

            matched.Add(commitment.Id);
            commitment.Title = input.Title;
            commitment.DayOfWeek = input.DayOfWeek;
            commitment.StartTime = input.StartTime;
            commitment.EndTime = input.EndTime;
        }

        foreach (var commitment in existing.Where(c => !matched.Contains(c.Id)))
            _db.Commitments.Remove(commitment);
    }

    private void SyncPreferences(Family family, IReadOnlyList<SavePreferenceInput> inputs)
    {
        var existing = family.Preferences.ToList();
        var byKey = existing.ToDictionary(p => (p.Kind, p.Value.ToLowerInvariant()));
        var keepKeys = new HashSet<(Domain.Enums.PreferenceKind, string)>(
            inputs.Select(i => (i.Kind, i.Value.ToLowerInvariant())));

        foreach (var pref in existing.Where(p => !keepKeys.Contains((p.Kind, p.Value.ToLowerInvariant()))))
            _db.Preferences.Remove(pref);

        foreach (var input in inputs)
        {
            if (!byKey.ContainsKey((input.Kind, input.Value.ToLowerInvariant())))
            {
                _db.Preferences.Add(new Preference
                {
                    Id = Guid.NewGuid(),
                    FamilyId = family.Id,
                    Kind = input.Kind,
                    Value = input.Value
                });
            }
        }
    }
}
