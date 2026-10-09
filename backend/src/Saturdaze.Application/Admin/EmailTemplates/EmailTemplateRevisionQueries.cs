using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>One row of the History dialog (L2-130).</summary>
public sealed record EmailTemplateRevisionSummaryDto(
    int Version, string Action, string Status, string Subject, DateTimeOffset OccurredAt, string AdminEmail);

/// <summary>A revision's full content, to load into the editor (L2-130 AC4).</summary>
public sealed record EmailTemplateRevisionDto(
    int Version,
    string Action,
    string Status,
    string Name,
    string Subject,
    string Preheader,
    string HtmlBody,
    string TextBody,
    System.Text.Json.JsonElement SampleData,
    DateTimeOffset OccurredAt,
    string AdminEmail);

/// <summary>A template's revisions, newest first (L2-130).</summary>
public sealed record ListEmailTemplateRevisionsQuery(Guid TemplateId) : IRequest<IReadOnlyList<EmailTemplateRevisionSummaryDto>>;

/// <summary>One revision of a template (L2-130).</summary>
public sealed record GetEmailTemplateRevisionQuery(Guid TemplateId, int Version) : IRequest<EmailTemplateRevisionDto>;

public sealed class ListEmailTemplateRevisionsQueryHandler
    : IRequestHandler<ListEmailTemplateRevisionsQuery, IReadOnlyList<EmailTemplateRevisionSummaryDto>>
{
    private readonly IAppDbContext _db;

    public ListEmailTemplateRevisionsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<EmailTemplateRevisionSummaryDto>> Handle(ListEmailTemplateRevisionsQuery request, CancellationToken ct)
    {
        if (!await _db.EmailTemplates.AnyAsync(t => t.Id == request.TemplateId, ct))
            throw new NotFoundException(nameof(EmailTemplate), request.TemplateId);
        var rows = await _db.EmailTemplateRevisions.AsNoTracking()
            .Where(r => r.TemplateId == request.TemplateId)
            .OrderByDescending(r => r.Version)
            .Select(r => new { r.Version, r.Action, r.Status, r.Subject, r.OccurredAt, r.AdminEmail })
            .ToListAsync(ct);
        return rows.Select(r => new EmailTemplateRevisionSummaryDto(
            r.Version, ActionName(r.Action), r.Status.ToString(), r.Subject, r.OccurredAt, r.AdminEmail)).ToList();
    }

    /// <summary>The wire names the History dialog shows: <c>create</c>, <c>edit</c>, <c>status</c>.</summary>
    public static string ActionName(EmailTemplateRevisionAction action) => action.ToString().ToLowerInvariant();
}

public sealed class GetEmailTemplateRevisionQueryHandler : IRequestHandler<GetEmailTemplateRevisionQuery, EmailTemplateRevisionDto>
{
    private readonly IAppDbContext _db;

    public GetEmailTemplateRevisionQueryHandler(IAppDbContext db) => _db = db;

    public async Task<EmailTemplateRevisionDto> Handle(GetEmailTemplateRevisionQuery request, CancellationToken ct)
    {
        var r = await _db.EmailTemplateRevisions.AsNoTracking()
            .FirstOrDefaultAsync(x => x.TemplateId == request.TemplateId && x.Version == request.Version, ct)
            ?? throw new NotFoundException($"Version {request.Version} of template '{request.TemplateId}' was not found.");
        return new EmailTemplateRevisionDto(
            r.Version,
            ListEmailTemplateRevisionsQueryHandler.ActionName(r.Action),
            r.Status.ToString(),
            r.Name,
            r.Subject,
            r.Preheader,
            r.HtmlBody,
            r.TextBody,
            SampleValues.Read(r.SampleData),
            r.OccurredAt,
            r.AdminEmail);
    }
}
