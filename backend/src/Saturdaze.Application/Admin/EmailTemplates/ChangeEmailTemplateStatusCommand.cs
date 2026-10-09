using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>Moves a template to <c>Active</c>, <c>Archived</c> or <c>Draft</c> at the loaded version (L2-129).</summary>
public sealed record ChangeEmailTemplateStatusCommand(Guid Id, string? Status, int Version) : IRequest<EmailTemplateDto>;

public sealed class ChangeEmailTemplateStatusCommandValidator : AbstractValidator<ChangeEmailTemplateStatusCommand>
{
    public ChangeEmailTemplateStatusCommandValidator()
    {
        RuleFor(c => c.Status).Must(s => EmailTemplateCatalog.TryParseStatus(s, out _)).OverridePropertyName("status")
            .WithMessage("Status must be Draft, Active or Archived.");
        RuleFor(c => c.Version).GreaterThanOrEqualTo(1).OverridePropertyName("version");
    }
}

public sealed class ChangeEmailTemplateStatusCommandHandler : IRequestHandler<ChangeEmailTemplateStatusCommand, EmailTemplateDto>
{
    private readonly IAppDbContext _db;
    private readonly EmailTemplateRevisionWriter _revisions;

    public ChangeEmailTemplateStatusCommandHandler(IAppDbContext db, EmailTemplateRevisionWriter revisions)
    {
        _db = db;
        _revisions = revisions;
    }

    public async Task<EmailTemplateDto> Handle(ChangeEmailTemplateStatusCommand request, CancellationToken ct)
    {
        var template = await _db.EmailTemplates.FirstOrDefaultAsync(t => t.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(EmailTemplate), request.Id);
        EmailTemplateCatalog.TryParseStatus(request.Status, out var status);
        if (template.IsSystem && status != EmailTemplateStatus.Active)
            throw SystemTemplate();
        EmailTemplateConcurrency.EnsureCurrent(template, request.Version);
        if (template.Status == status) return EmailTemplateDto.From(template);

        template.Status = status;
        template.Version++;
        _revisions.Write(template, EmailTemplateRevisionAction.Status);
        await EmailTemplateConcurrency.SaveAsync(_db, ct);
        return EmailTemplateDto.From(template);
    }

    public static BadRequestException SystemTemplate() => new("system_template",
        "A system template stays active and cannot be deleted.");
}
