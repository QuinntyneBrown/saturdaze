using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Geocoding;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Families;

public sealed class SaveFamilyProfileCommandHandler : IRequestHandler<SaveFamilyProfileCommand, FamilyProfileDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;
    private readonly FamilyProfileReader _reader;
    private readonly FamilyOwnership _ownership;
    private readonly IGeocoder _geocoder;

    /// <summary>A save never waits longer than this on the geocoder (L2-190).</summary>
    public static readonly TimeSpan GeocodeBudget = TimeSpan.FromSeconds(5);

    public SaveFamilyProfileCommandHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        ICurrentUserAccessor user,
        IDateTimeProvider clock,
        FamilyProfileReader reader,
        FamilyOwnership ownership,
        IGeocoder geocoder)
    {
        _db = db;
        _current = current;
        _user = user;
        _clock = clock;
        _reader = reader;
        _ownership = ownership;
        _geocoder = geocoder;
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
        if (family is not null && request.Members is not null
            && !_ownership.IsOwner(family) && MembersChange(family.Members, request.Members))
            throw new ForbiddenException("owner_only", "Only the family's owner can change who's in.");

        if (family is null)
        {
            if (string.IsNullOrWhiteSpace(request.HomeLocation))
                throw new ValidationException(nameof(request.HomeLocation), "A home location is needed to set up the family.");

            var userId = _user.UserId
                ?? throw new InvalidCredentialsException("unauthenticated", "Sign in to continue.");
            var owner = await _db.Users.SingleOrDefaultAsync(u => u.Id == userId, cancellationToken)
                ?? throw new InvalidCredentialsException("unauthenticated", "Sign in to continue.");

            family = new Family { Id = Guid.NewGuid(), OwnerUserId = owner.Id };
            _db.Families.Add(family);
            owner.FamilyId = family.Id;
            owner.UpdatedAtUtc = _clock.UtcNow;
        }

        // Partial profile (L2-010): only what the request carries changes.
        if (request.HomeLocation is not null) family.HomeLocation = request.HomeLocation;
        if (request.BudgetEnabled is { } budget) family.BudgetEnabled = budget;
        if (request.Name is not null) family.Name = string.IsNullOrWhiteSpace(request.Name) ? null : request.Name.Trim();
        if (request.TryNewEnabled is { } tryNew) family.TryNewEnabled = tryNew;
        if (request.FridayPreviewEnabled is { } friday) family.FridayPreviewEnabled = friday;
        if (request.MaxDriveMinutes is { } maxDrive) family.MaxDriveMinutes = maxDrive;
        if (request.ExcludedThemes is not null)
            family.ExcludedThemes = request.ExcludedThemes.Select(t => t.Trim().ToLowerInvariant()).Distinct().ToList();
        if (request.QuietSunday is { } quiet) family.QuietSunday = quiet;
        if (request.DayStart is { } dayStart) family.DayStart = dayStart;
        if (request.YoungestBedtime is { } bedtime) family.YoungestBedtime = bedtime;
        if (request.ClearYoungestBedtime) family.YoungestBedtime = null;
        if (request.SundayDinnerAtHome is { } dinnerAtHome) family.SundayDinnerAtHome = dinnerAtHome;
        if (request.OutingsPerDay is { } outings) family.OutingsPerDay = outings;
        if (request.Leaning is { } leaning) family.Leaning = leaning;

        if (request.Members is not null)
        {
            var withAccess = await MembersWithAccessAsync(family, cancellationToken);
            SyncMembers(family, request.Members, withAccess);
        }
        if (request.Commitments is not null)
        {
            CheckCommitments(family, request.Commitments);
            var locations = await ResolveLocationsAsync(family, request.Commitments, cancellationToken);
            SyncCommitments(family, request.Commitments, locations);
        }
        if (request.Preferences is not null) SyncPreferences(family, request.Preferences);

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
                    Age = input.Age,
                    Interests = CleanInterests(input.Interests)
                });
                continue;
            }

            matched.Add(member.Id);
            member.Name = input.Name;
            member.Age = input.Age;
            if (input.Interests is not null) member.Interests = CleanInterests(input.Interests);
        }

        var dropped = existing.Where(m => !matched.Contains(m.Id)).ToList();
        if (dropped.Any(m => withAccess.Contains(m.Id)))
            throw new ConflictException("member_has_access", "Remove a member who is invited or signs in from the family page.");

        foreach (var member in dropped)
            _db.FamilyMembers.Remove(member);
    }

    private static List<string> CleanInterests(IReadOnlyList<string>? interests) =>
        (interests ?? Array.Empty<string>()).Select(i => i.Trim()).Where(i => i.Length > 0).ToList();

    /// <summary>
    /// Attendees must be the family's own members, and overlaps need an adult each
    /// (L2-192). The validator checks adults only when the request carries members.
    /// </summary>
    private static void CheckCommitments(Family family, IReadOnlyList<SaveCommitmentInput> inputs)
    {
        var memberIds = family.Members.Select(m => m.Id).ToHashSet();
        if (inputs.SelectMany(c => c.AttendeeMemberIds ?? Array.Empty<Guid>()).Any(id => !memberIds.Contains(id)))
            throw new ValidationException("attendeeMemberIds", "Attendees must be members of this family.");

        var adults = family.Members.Count(m => m.Age >= CommitmentOverlaps.AdultAge);
        if (!CommitmentOverlaps.AreSplittable(inputs, adults))
            throw new ValidationException("commitments", CommitmentOverlaps.Message);
    }

    /// <summary>
    /// The place of each commitment that has an address: as sent when it has coordinates,
    /// otherwise geocoded within the budget; unchanged addresses keep their stored place.
    /// </summary>
    private async Task<Dictionary<SaveCommitmentInput, GeoLocation?>> ResolveLocationsAsync(
        Family family, IReadOnlyList<SaveCommitmentInput> inputs, CancellationToken ct)
    {
        var resolved = new Dictionary<SaveCommitmentInput, GeoLocation?>(ReferenceEqualityComparer.Instance);
        foreach (var input in inputs)
        {
            var address = input.Location?.Address?.Trim();
            if (string.IsNullOrEmpty(address))
            {
                resolved[input] = null;
                continue;
            }
            if (GeoLocation.From(input.Location!.Latitude, input.Location.Longitude, address) is { } given)
            {
                resolved[input] = given;
                continue;
            }
            var stored = family.Commitments.FirstOrDefault(c => c.Location is not null
                && string.Equals(c.Location.Address, address, StringComparison.OrdinalIgnoreCase));
            resolved[input] = stored?.Location?.Copy() ?? await GeocodeWithinBudgetAsync(address, ct);
        }
        return resolved;
    }

    /// <summary>Null on no match, an outage or the budget running out; the save goes on (L2-190).</summary>
    private async Task<GeoLocation?> GeocodeWithinBudgetAsync(string address, CancellationToken ct)
    {
        using var budget = CancellationTokenSource.CreateLinkedTokenSource(ct);
        budget.CancelAfter(GeocodeBudget);
        try
        {
            var hit = await _geocoder.GeocodeAsync(address, budget.Token);
            if (hit is not null && string.IsNullOrWhiteSpace(hit.Address)) hit.Address = address;
            return hit;
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
        {
            return null;
        }
    }

    private void SyncCommitments(
        Family family, IReadOnlyList<SaveCommitmentInput> inputs, IReadOnlyDictionary<SaveCommitmentInput, GeoLocation?> locations)
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
                    EndTime = input.EndTime,
                    AttendeeMemberIds = (input.AttendeeMemberIds ?? Array.Empty<Guid>()).Distinct().ToList(),
                    Location = locations[input]
                });
                continue;
            }

            matched.Add(commitment.Id);
            commitment.Title = input.Title;
            commitment.DayOfWeek = input.DayOfWeek;
            commitment.StartTime = input.StartTime;
            commitment.EndTime = input.EndTime;
            commitment.AttendeeMemberIds = (input.AttendeeMemberIds ?? Array.Empty<Guid>()).Distinct().ToList();
            commitment.Location = GeoLocation.Merge(commitment.Location, locations[input]);
            if (locations[input] is null) commitment.Location = null;
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
