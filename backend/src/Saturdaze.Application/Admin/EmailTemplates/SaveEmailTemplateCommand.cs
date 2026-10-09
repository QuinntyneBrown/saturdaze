using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>
/// Saves a template's content (L2-127). <paramref name="Version"/> is the version the editor
/// loaded; key, category, status and the system flag never change here.
/// </summary>
public sealed record SaveEmailTemplateCommand(
    Guid Id,
    string? Name,
    string? Description,
    string? Subject,
    string? Preheader,
    string? HtmlBody,
    string? TextBody,
    IReadOnlyDictionary<string, string>? SampleData,
    int Version) : IRequest<EmailTemplateDto>;

/// <summary>The field limits shared by a save and a preview (L2-124).</summary>
public static class EmailTemplateLimits
{
    public const int Subject = 200;
    public const int Preheader = 200;
    public const int HtmlBody = 100_000;
    public const int TextBody = 50_000;
    public const int SampleEntries = 100;
    public const int SampleValue = 2_000;
}

public sealed class SaveEmailTemplateCommandValidator : AbstractValidator<SaveEmailTemplateCommand>
{
    public SaveEmailTemplateCommandValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(120).OverridePropertyName("name")
            .WithMessage("Name is required (at most 120 characters).");
        RuleFor(c => c.Description).MaximumLength(500).OverridePropertyName("description");
        RuleFor(c => c.Subject).NotEmpty().MaximumLength(EmailTemplateLimits.Subject).OverridePropertyName("subject")
            .WithMessage("Subject is required (at most 200 characters).");
        RuleFor(c => c.Preheader).MaximumLength(EmailTemplateLimits.Preheader).OverridePropertyName("preheader")
            .WithMessage("Preheader is at most 200 characters.");
        RuleFor(c => c.HtmlBody).NotEmpty().MaximumLength(EmailTemplateLimits.HtmlBody).OverridePropertyName("htmlBody")
            .WithMessage("HTML body is required (at most 100 000 characters).");
        RuleFor(c => c.TextBody).NotEmpty().MaximumLength(EmailTemplateLimits.TextBody).OverridePropertyName("textBody")
            .WithMessage("Plain-text body is required (at most 50 000 characters).");
        RuleFor(c => c.SampleData).Must(SampleDataRules.Valid).OverridePropertyName("sampleData")
            .WithMessage(SampleDataRules.Message);
        RuleFor(c => c.Version).GreaterThanOrEqualTo(1).OverridePropertyName("version");
    }
}

/// <summary>Sample data is at most 100 placeholder names, each with a value of at most 2 000 characters.</summary>
public static class SampleDataRules
{
    public const string Message = "Sample data holds at most 100 placeholder names with values of at most 2 000 characters.";

    public static bool Valid(IReadOnlyDictionary<string, string>? values)
        => values is null || (values.Count <= EmailTemplateLimits.SampleEntries && values.All(kv =>
            EmailTemplateRules.IsPlaceholderName(kv.Key) && (kv.Value?.Length ?? 0) <= EmailTemplateLimits.SampleValue));
}

public sealed class SaveEmailTemplateCommandHandler : IRequestHandler<SaveEmailTemplateCommand, EmailTemplateDto>
{
    private readonly IAppDbContext _db;
    private readonly EmailTemplateRevisionWriter _revisions;

    public SaveEmailTemplateCommandHandler(IAppDbContext db, EmailTemplateRevisionWriter revisions)
    {
        _db = db;
        _revisions = revisions;
    }

    public async Task<EmailTemplateDto> Handle(SaveEmailTemplateCommand request, CancellationToken ct)
    {
        var template = await _db.EmailTemplates.FirstOrDefaultAsync(t => t.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(EmailTemplate), request.Id);
        EmailTemplateConcurrency.EnsureCurrent(template, request.Version);

        EmailTemplateRules.CheckPlaceholders(request.Subject, request.Preheader, request.HtmlBody, request.TextBody);
        EmailTemplateRules.CheckHtml(request.HtmlBody);
        EmailTemplateRules.CheckRequired(EmailTemplateCatalog.RequiredPlaceholders(template), request.HtmlBody, request.TextBody);

        template.Name = request.Name!.Trim();
        template.Description = request.Description?.Trim() ?? string.Empty;
        template.Subject = request.Subject!.Trim();
        template.Preheader = request.Preheader?.Trim() ?? string.Empty;
        template.HtmlBody = request.HtmlBody!;
        template.TextBody = request.TextBody!;
        template.SampleData = SampleValues.Write(request.SampleData);
        template.Version++;
        _revisions.Write(template, EmailTemplateRevisionAction.Edit);

        await EmailTemplateConcurrency.SaveAsync(_db, ct);
        return EmailTemplateDto.From(template);
    }
}

/// <summary>Optimistic concurrency on <see cref="EmailTemplate.Version"/> (L2-127 AC2, L2-129).</summary>
public static class EmailTemplateConcurrency
{
    public static ConflictException Stale() => new("template_stale",
        "Someone else changed this template. Reload to see their changes.");

    public static void EnsureCurrent(EmailTemplate template, int version)
    {
        if (template.Version != version) throw Stale();
    }

    /// <summary>Saves, turning a lost race on the version token into <c>template_stale</c>.</summary>
    public static async Task SaveAsync(IAppDbContext db, CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw Stale();
        }
    }
}
