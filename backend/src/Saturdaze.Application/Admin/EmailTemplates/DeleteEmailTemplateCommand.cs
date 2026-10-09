using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>Deletes a non-system template and, by cascade, its revisions (L2-135).</summary>
public sealed record DeleteEmailTemplateCommand(Guid Id) : IRequest;

public sealed class DeleteEmailTemplateCommandHandler : IRequestHandler<DeleteEmailTemplateCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _user;
    private readonly ILogger<DeleteEmailTemplateCommandHandler> _logger;

    public DeleteEmailTemplateCommandHandler(IAppDbContext db, ICurrentUserAccessor user, ILogger<DeleteEmailTemplateCommandHandler> logger)
    {
        _db = db;
        _user = user;
        _logger = logger;
    }

    public async Task Handle(DeleteEmailTemplateCommand request, CancellationToken ct)
    {
        var template = await _db.EmailTemplates.FirstOrDefaultAsync(t => t.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(EmailTemplate), request.Id);
        if (template.IsSystem) throw ChangeEmailTemplateStatusCommandHandler.SystemTemplate();

        _db.EmailTemplates.Remove(template);
        await _db.SaveChangesAsync(ct);
        // The revisions go with the template, so the log is the record of the deletion.
        _logger.LogInformation("Email template {Key} ({TemplateId}) deleted by administrator {AdminId}",
            template.Key, template.Id, _user.UserId);
    }
}
