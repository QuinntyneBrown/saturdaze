using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.EventSubmissions;

/// <summary>The submitter puts away the "Not added" card for their suggestion (L2-149 AC3).</summary>
public sealed record DismissSubmissionCommand(Guid Id) : IRequest;

public sealed class DismissSubmissionCommandHandler : IRequestHandler<DismissSubmissionCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public DismissSubmissionCommandHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task Handle(DismissSubmissionCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();
        // Someone else's suggestion answers like a missing one (L2-149 AC4).
        var submission = await _db.EventSubmissions
            .FirstOrDefaultAsync(s => s.Id == request.Id && s.SubmittedByUserId == userId, ct)
            ?? throw new NotFoundException(nameof(EventSubmission), request.Id);

        submission.SubmitterDismissedAtUtc ??= _clock.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
