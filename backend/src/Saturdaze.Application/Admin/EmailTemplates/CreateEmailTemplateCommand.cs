using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>Creates a draft from the category's starter, or from <paramref name="DuplicateOf"/>'s content (L2-126).</summary>
public sealed record CreateEmailTemplateCommand(
    string? Key, string? Name, string? Description, string? Category, Guid? DuplicateOf = null) : IRequest<EmailTemplateDto>;

public sealed class CreateEmailTemplateCommandValidator : AbstractValidator<CreateEmailTemplateCommand>
{
    public CreateEmailTemplateCommandValidator()
    {
        RuleFor(c => c.Key).NotEmpty().MaximumLength(100).Matches(EmailTemplateRules.KeyPattern)
            .OverridePropertyName("key")
            .WithMessage("Use lowercase letters and digits in words joined by dots or hyphens, such as account.password-reset.");
        RuleFor(c => c.Name).NotEmpty().MaximumLength(120).OverridePropertyName("name").WithMessage("Name is required (at most 120 characters).");
        RuleFor(c => c.Description).MaximumLength(500).OverridePropertyName("description");
        RuleFor(c => c.Category).Must(c => EmailTemplateCatalog.TryParseCategory(c, out _)).OverridePropertyName("category")
            .WithMessage("Category must be Account, Notification, Scheduled, SpecialOccasion or Marketing.");
    }
}

public sealed class CreateEmailTemplateCommandHandler : IRequestHandler<CreateEmailTemplateCommand, EmailTemplateDto>
{
    private readonly IAppDbContext _db;
    private readonly EmailTemplateRevisionWriter _revisions;

    public CreateEmailTemplateCommandHandler(IAppDbContext db, EmailTemplateRevisionWriter revisions)
    {
        _db = db;
        _revisions = revisions;
    }

    public async Task<EmailTemplateDto> Handle(CreateEmailTemplateCommand request, CancellationToken ct)
    {
        var key = request.Key!.Trim();
        if (await _db.EmailTemplates.AnyAsync(t => t.Key == key, ct))
            throw new ConflictException("template_key_exists", "A template already uses this key. Choose another.");
        EmailTemplateCatalog.TryParseCategory(request.Category, out var category);

        EmailTemplateContent content;
        if (request.DuplicateOf is { } sourceId)
        {
            var source = await _db.EmailTemplates.AsNoTracking().FirstOrDefaultAsync(t => t.Id == sourceId, ct)
                ?? throw new NotFoundException(nameof(EmailTemplate), sourceId);
            content = new EmailTemplateContent(source.Subject, source.Preheader, source.HtmlBody, source.TextBody, SampleValues.Read(source.SampleData));
        }
        else
        {
            content = EmailTemplateStarters.For(category);
        }

        var template = new EmailTemplate
        {
            Id = Guid.NewGuid(),
            Key = key,
            Name = request.Name!.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            Category = category,
            Status = EmailTemplateStatus.Draft,
            Subject = content.Subject,
            Preheader = content.Preheader,
            HtmlBody = content.HtmlBody,
            TextBody = content.TextBody,
            SampleData = SampleValues.Write(content.SampleData),
            IsSystem = false,
            Version = 1,
        };
        _revisions.Write(template, EmailTemplateRevisionAction.Create);
        template.CreatedAt = template.UpdatedAt;
        template.CreatedByEmail = template.UpdatedByEmail;
        _db.EmailTemplates.Add(template);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Another administrator took the key between the check and the save.
            if (await _db.EmailTemplates.AsNoTracking().AnyAsync(t => t.Key == key && t.Id != template.Id, ct))
                throw new ConflictException("template_key_exists", "A template already uses this key. Choose another.");
            throw;
        }
        return EmailTemplateDto.From(template);
    }
}
