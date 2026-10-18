using FluentValidation;

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
        });
        RuleFor(x => x.Commitments)
            .Must(cs => NoOverlapWithinSameDay(cs!))
            .When(x => x.Commitments is not null)
            .WithMessage("Commitments on the same day must not overlap.");

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

    private static bool NoOverlapWithinSameDay(IReadOnlyList<SaveCommitmentInput> commitments)
    {
        foreach (var grp in commitments.GroupBy(c => c.DayOfWeek))
        {
            var ordered = grp.OrderBy(c => c.StartTime).ToList();
            for (var i = 1; i < ordered.Count; i++)
            {
                if (ordered[i].StartTime < ordered[i - 1].EndTime) return false;
            }
        }
        return true;
    }
}
