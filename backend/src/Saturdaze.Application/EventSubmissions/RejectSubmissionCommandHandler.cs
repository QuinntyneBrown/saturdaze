using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.EventSubmissions;

public sealed class RejectSubmissionCommandHandler
    : IRequestHandler<RejectSubmissionCommand, EventSubmissionDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public RejectSubmissionCommandHandler(
        IAppDbContext db,
        ICurrentUserAccessor current,
        IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<EventSubmissionDto> Handle(RejectSubmissionCommand request, CancellationToken ct)
    {
        var adminId = _current.UserId ?? throw new InvalidCredentialsException();

        var submission = await _db.EventSubmissions
            .FirstOrDefaultAsync(s => s.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(EventSubmission), request.Id);

        var email = await _db.Users.AsNoTracking()
            .Where(u => u.Id == submission.SubmittedByUserId)
            .Select(u => u.Email)
            .FirstOrDefaultAsync(ct);

        if (submission.Status == EventSubmissionStatus.Approved)
        {
            throw new ConflictException("submission_already_approved");
        }

        if (submission.Status == EventSubmissionStatus.Rejected)
        {
            return EventSubmissionMapper.ToDto(submission, email);
        }

        submission.Status = EventSubmissionStatus.Rejected;
        submission.ReviewedByUserId = adminId;
        submission.ReviewedAtUtc = _clock.UtcNow;
        submission.RejectionReason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();

        await _db.SaveChangesAsync(ct);

        return EventSubmissionMapper.ToDto(submission, email);
    }
}
