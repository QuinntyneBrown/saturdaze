using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>Every email template ordered by name (L2-131): optionally one category or status, and a search over name, key and subject.</summary>
public sealed record ListEmailTemplatesQuery(string? Q = null, string? Category = null, string? Status = null)
    : IRequest<IReadOnlyList<EmailTemplateSummaryDto>>;

public sealed class ListEmailTemplatesQueryValidator : AbstractValidator<ListEmailTemplatesQuery>
{
    public ListEmailTemplatesQueryValidator()
    {
        RuleFor(q => q.Category).Must(c => c is null || EmailTemplateCatalog.TryParseCategory(c, out _))
            .WithName("category").WithMessage("Category must be Account, Notification, Scheduled, SpecialOccasion or Marketing.");
        RuleFor(q => q.Status).Must(s => s is null || EmailTemplateCatalog.TryParseStatus(s, out _))
            .WithName("status").WithMessage("Status must be Draft, Active or Archived.");
        RuleFor(q => q.Q).MaximumLength(200).WithName("q");
    }
}

public sealed class ListEmailTemplatesQueryHandler : IRequestHandler<ListEmailTemplatesQuery, IReadOnlyList<EmailTemplateSummaryDto>>
{
    private readonly IAppDbContext _db;

    public ListEmailTemplatesQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<EmailTemplateSummaryDto>> Handle(ListEmailTemplatesQuery request, CancellationToken ct)
    {
        var templates = _db.EmailTemplates.AsNoTracking();
        if (EmailTemplateCatalog.TryParseCategory(request.Category, out var category))
            templates = templates.Where(t => t.Category == category);
        if (EmailTemplateCatalog.TryParseStatus(request.Status, out var status))
            templates = templates.Where(t => t.Status == status);
        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            var q = request.Q.Trim().ToLower();
            templates = templates.Where(t =>
                t.Name.ToLower().Contains(q) || t.Key.ToLower().Contains(q) || t.Subject.ToLower().Contains(q));
        }

        var rows = await templates.OrderBy(t => t.Name).ThenBy(t => t.Key).ToListAsync(ct);
        return rows.Select(EmailTemplateSummaryDto.From).ToList();
    }
}
