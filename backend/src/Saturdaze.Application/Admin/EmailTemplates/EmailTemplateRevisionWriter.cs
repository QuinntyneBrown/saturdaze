using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>
/// The one place that stamps a template change and writes its <see cref="EmailTemplateRevision"/>
/// (L2-136): the administrator from the current request, the UTC time and a snapshot of the
/// content at the template's (already incremented) version. The handler's save persists both.
/// </summary>
public sealed class EmailTemplateRevisionWriter
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;

    public EmailTemplateRevisionWriter(IAppDbContext db, ICurrentUserAccessor user, IDateTimeProvider clock)
    {
        _db = db;
        _user = user;
        _clock = clock;
    }

    /// <summary>Stamps <c>UpdatedAt</c>, <c>UpdatedBy</c> and <c>UpdatedByEmail</c> and records the revision.</summary>
    public void Write(EmailTemplate template, EmailTemplateRevisionAction action)
    {
        var adminId = _user.UserId ?? throw new UnauthorizedAccessException("Template changes need a signed-in administrator.");
        var email = _user.Email ?? string.Empty;
        var now = _clock.UtcNow.ToUniversalTime();

        template.UpdatedAt = now;
        template.UpdatedBy = adminId;
        template.UpdatedByEmail = email;

        _db.EmailTemplateRevisions.Add(new EmailTemplateRevision
        {
            Id = Guid.NewGuid(),
            TemplateId = template.Id,
            Version = template.Version,
            Action = action,
            Status = template.Status,
            Name = template.Name,
            Subject = template.Subject,
            Preheader = template.Preheader,
            HtmlBody = template.HtmlBody,
            TextBody = template.TextBody,
            SampleData = template.SampleData,
            OccurredAt = now,
            AdminUserId = adminId,
            AdminEmail = email,
        });
    }
}
