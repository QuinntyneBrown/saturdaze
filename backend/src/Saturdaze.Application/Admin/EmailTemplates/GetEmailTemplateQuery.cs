using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>One template with its content and required placeholders, for the editor (L2-133).</summary>
public sealed record GetEmailTemplateQuery(Guid Id) : IRequest<EmailTemplateDto>;

public sealed class GetEmailTemplateQueryHandler : IRequestHandler<GetEmailTemplateQuery, EmailTemplateDto>
{
    private readonly IAppDbContext _db;

    public GetEmailTemplateQueryHandler(IAppDbContext db) => _db = db;

    public async Task<EmailTemplateDto> Handle(GetEmailTemplateQuery request, CancellationToken ct)
    {
        var template = await _db.EmailTemplates.AsNoTracking().FirstOrDefaultAsync(t => t.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(EmailTemplate), request.Id);
        return EmailTemplateDto.From(template);
    }
}
