using FluentValidation;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Families;

public sealed class SaveFamilyProfileCommandValidator : AbstractValidator<SaveFamilyProfileCommand>
{
    public SaveFamilyProfileCommandValidator()
    {
        // Each part is validated only when supplied; an omitted part keeps
        // the stored value (L2-010 partial profile).
        RuleFor(x => x.HomeLocation).NotEmpty().MaximumLength(200)
            .When(x => x.HomeLocation is not null);
        RuleFor(x => x.Name).MaximumLength(100);

        RuleForEach(x => x.Members).ChildRules(m =>
        {
            m.RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
            m.RuleFor(x => x.Age).InclusiveBetween(0, 120);
            // Interests (L2-196): up to 8, 1-40 characters, unique per member.
            m.RuleFor(x => x.Interests!).Must(i => i.Count <= MaxInterests)
                .WithMessage($"A member has at most {MaxInterests} interests.")
                .Must(i => i.Distinct(StringComparer.OrdinalIgnoreCase).Count() == i.Count)
                .WithMessage("Interests must be unique.")
                .When(x => x.Interests is not null);
            m.RuleForEach(x => x.Interests).NotEmpty().MaximumLength(40);
        });
        RuleFor(x => x.Members)
            .Must(ms => ms!.Select(m => m.Name).Distinct(StringComparer.OrdinalIgnoreCase).Count() == ms!.Count)
            .When(x => x.Members is not null)
            .WithMessage("Member names must be unique.");

        RuleForEach(x => x.Commitments).ChildRules(c =>
        {
            c.RuleFor(x => x.Title).NotEmpty().MaximumLength(120);
            c.RuleFor(x => x.StartTime).LessThan(x => x.EndTime)
                .WithMessage("StartTime must be before EndTime.");
            c.RuleFor(x => x.Location!.Address).MaximumLength(300).When(x => x.Location is not null);
            c.RuleFor(x => x.Location!.Latitude).InclusiveBetween(-90m, 90m).When(x => x.Location?.Latitude is not null);
            c.RuleFor(x => x.Location!.Longitude).InclusiveBetween(-180m, 180m).When(x => x.Location?.Longitude is not null);
        });
        // Overlaps are allowed only when different people go (L2-192); the handler also
        // checks the adults against the stored family when the request has no members.
        RuleFor(x => x.Commitments)
            .Must((cmd, cs) => CommitmentOverlaps.AreSplittable(cs!, AdultsIn(cmd.Members)))
            .When(x => x.Commitments is not null)
            .WithMessage(CommitmentOverlaps.Message);

        // Planning boundaries (L2-191, L2-194, L2-195).
        RuleFor(x => x.MaxDriveMinutes).InclusiveBetween(15, 240).When(x => x.MaxDriveMinutes is not null);
        RuleForEach(x => x.ExcludedThemes).Must(ContentThemes.IsKnown)
            .WithMessage(t => $"Themes are one of {string.Join(", ", ContentThemes.All)}.")
            .OverridePropertyName("excludedThemes");
        RuleFor(x => x.DayStart!.Value)
            .Must(t => t >= new TimeOnly(7, 0) && t <= new TimeOnly(11, 0) && OnTheHalfHour(t))
            .WithMessage("The day starts between 7:00 and 11:00, on the half hour.")
            .OverridePropertyName("dayStart")
            .When(x => x.DayStart is not null);
        RuleFor(x => x.YoungestBedtime!.Value)
            .Must(t => t >= new TimeOnly(18, 0) && t <= new TimeOnly(22, 0) && OnTheHalfHour(t))
            .WithMessage("Bedtime is between 18:00 and 22:00, on the half hour.")
            .OverridePropertyName("youngestBedtime")
            .When(x => x.YoungestBedtime is not null);
        RuleFor(x => x.OutingsPerDay).InclusiveBetween(1, 3).When(x => x.OutingsPerDay is not null);

        RuleForEach(x => x.Preferences).ChildRules(p =>
        {
            p.RuleFor(x => x.Value).NotEmpty().MaximumLength(120);
        });
        RuleFor(x => x.Preferences)
            .Must(ps => ps!
                .Select(p => (p.Kind, p.Value.ToLowerInvariant()))
                .Distinct()
                .Count() == ps!.Count)
            .When(x => x.Preferences is not null)
            .WithMessage("Preferences must be unique by (Kind, Value).");
    }

    public const int MaxInterests = 8;

    private static bool OnTheHalfHour(TimeOnly t) => t.Second == 0 && t.Minute is 0 or 30;

    /// <summary>Adults in the request's members, or null when it carries none (the handler checks then).</summary>
    private static int? AdultsIn(IReadOnlyList<SaveMemberInput>? members) =>
        members?.Count(m => m.Age >= CommitmentOverlaps.AdultAge);
}
