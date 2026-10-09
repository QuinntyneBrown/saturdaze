using FluentValidation;
using MediatR;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>Renders unsaved content with sample data, without touching the database (L2-128).</summary>
public sealed record PreviewEmailTemplateQuery(
    string? Subject,
    string? Preheader,
    string? HtmlBody,
    string? TextBody,
    IReadOnlyDictionary<string, string>? SampleData) : IRequest<EmailPreviewDto>;

public sealed class PreviewEmailTemplateQueryValidator : AbstractValidator<PreviewEmailTemplateQuery>
{
    public PreviewEmailTemplateQueryValidator()
    {
        RuleFor(q => q.Subject).MaximumLength(EmailTemplateLimits.Subject).OverridePropertyName("subject");
        RuleFor(q => q.Preheader).MaximumLength(EmailTemplateLimits.Preheader).OverridePropertyName("preheader");
        RuleFor(q => q.HtmlBody).MaximumLength(EmailTemplateLimits.HtmlBody).OverridePropertyName("htmlBody");
        RuleFor(q => q.TextBody).MaximumLength(EmailTemplateLimits.TextBody).OverridePropertyName("textBody");
        RuleFor(q => q.SampleData).Must(SampleDataRules.Valid).OverridePropertyName("sampleData").WithMessage(SampleDataRules.Message);
    }
}

public sealed class PreviewEmailTemplateQueryHandler : IRequestHandler<PreviewEmailTemplateQuery, EmailPreviewDto>
{
    private readonly EmailTemplateRenderer _renderer;

    public PreviewEmailTemplateQueryHandler(EmailTemplateRenderer renderer) => _renderer = renderer;

    public Task<EmailPreviewDto> Handle(PreviewEmailTemplateQuery request, CancellationToken ct)
    {
        // The same refusals as a save, so the preview never shows what cannot be saved (L2-128).
        EmailTemplateRules.CheckPlaceholders(request.Subject, request.Preheader, request.HtmlBody, request.TextBody);
        EmailTemplateRules.CheckHtml(request.HtmlBody);
        return Task.FromResult(_renderer.Render(
            request.Subject, request.Preheader, request.HtmlBody, request.TextBody, request.SampleData));
    }
}
