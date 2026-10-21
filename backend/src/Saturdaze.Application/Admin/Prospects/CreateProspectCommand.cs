using FluentValidation;
using MediatR;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Planning;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Prospects;

/// <summary>
/// An administrator describes a prospective family and the planner drafts its
/// weekend (L2-159): an ownerless family, its members and likes, and a weekend
/// planned exactly as <c>POST /api/weekends/plan</c> would.
/// </summary>
public sealed record CreateProspectCommand(
    string FamilyName,
    string? HomeLocation,
    IReadOnlyList<ProspectMemberDto> Members,
    IReadOnlyList<string>? Likes,
    DateOnly? WeekendOf) : IRequest<ProspectDto>;

public sealed class CreateProspectCommandValidator : AbstractValidator<CreateProspectCommand>
{
    public const int MaxMembers = 8;

    public CreateProspectCommandValidator()
    {
        RuleFor(x => x.FamilyName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.HomeLocation).MaximumLength(200);
        RuleFor(x => x.Members)
            .NotNull().WithMessage("Add at least one family member.")
            .Must(m => m.Count > 0).WithMessage("Add at least one family member.")
            .Must(m => m.Count <= MaxMembers).WithMessage($"A sample family has at most {MaxMembers} members.");
        RuleForEach(x => x.Members).ChildRules(member =>
        {
            member.RuleFor(m => m.Name).NotEmpty().MaximumLength(100);
            member.RuleFor(m => m.Age).InclusiveBetween(0, 120);
        });
        RuleForEach(x => x.Likes).NotEmpty().MaximumLength(60).OverridePropertyName("Likes");
        RuleFor(x => x.WeekendOf)
            .Must(d => d is null || d.Value.DayOfWeek == DayOfWeek.Saturday)
            .WithMessage("WeekendOf must be a Saturday.");
    }
}

public sealed class CreateProspectCommandHandler : IRequestHandler<CreateProspectCommand, ProspectDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;
    private readonly IWeekendPlanner _planner;
    private readonly PlannerInputLoader _loader;
    private readonly ProspectReader _reader;

    public CreateProspectCommandHandler(
        IAppDbContext db,
        ICurrentUserAccessor user,
        IDateTimeProvider clock,
        IWeekendPlanner planner,
        PlannerInputLoader loader,
        ProspectReader reader)
    {
        _db = db;
        _user = user;
        _clock = clock;
        _planner = planner;
        _loader = loader;
        _reader = reader;
    }

    public async Task<ProspectDto> Handle(CreateProspectCommand request, CancellationToken ct)
    {
        var weekendOf = request.WeekendOf ?? GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(_clock.Today);

        var family = new Family
        {
            Id = Guid.NewGuid(),
            Name = request.FamilyName.Trim(),
            HomeLocation = request.HomeLocation?.Trim() ?? string.Empty,
            BudgetEnabled = false,
            TryNewEnabled = false,
            FridayPreviewEnabled = true,
        };
        _db.Families.Add(family);
        foreach (var member in request.Members)
            _db.FamilyMembers.Add(new FamilyMember { Id = Guid.NewGuid(), FamilyId = family.Id, Name = member.Name.Trim(), Age = member.Age });
        foreach (var like in (request.Likes ?? Array.Empty<string>()).Select(l => l.Trim()).Where(l => l.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase))
            _db.Preferences.Add(new Preference { Id = Guid.NewGuid(), FamilyId = family.Id, Kind = PreferenceKind.Like, Value = like });
        // The planner reads the family back from the database.
        await _db.SaveChangesAsync(ct);

        var ctx = await _loader.LoadAsync(family.Id, weekendOf, ct);
        var inputs = ctx.ToInputs(lockedBlocks: Array.Empty<ItineraryBlock>(), errand: null, seed: weekendOf.DayNumber);
        var blocks = _planner.Plan(inputs);

        var weekend = new Weekend
        {
            Id = Guid.NewGuid(),
            FamilyId = family.Id,
            WeekendOf = weekendOf,
            RegenerateCount = 0,
            Blocks = blocks.Select(b => new ItineraryBlock
            {
                Id = b.Id == Guid.Empty ? Guid.NewGuid() : b.Id,
                Day = b.Day,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                Kind = b.Kind,
                Title = b.Title,
                RefId = b.RefId,
                IsLocked = b.IsLocked,
                Reason = b.Reason,
                SortOrder = b.SortOrder,
                Stop = b.Stop?.Copy(),
                FromCalendar = b.FromCalendar
            }).ToList(),
            Home = ctx.Home.Copy()
        };
        _db.Weekends.Add(weekend);

        var prospect = new Prospect
        {
            Id = Guid.NewGuid(),
            FamilyId = family.Id,
            WeekendId = weekend.Id,
            CreatedByUserId = _user.UserId ?? Guid.Empty,
            CreatedAtUtc = _clock.UtcNow,
        };
        _db.Prospects.Add(prospect);
        await _db.SaveChangesAsync(ct);

        return await _reader.ReadAsync(prospect.Id, withWeekend: true, ct);
    }
}
