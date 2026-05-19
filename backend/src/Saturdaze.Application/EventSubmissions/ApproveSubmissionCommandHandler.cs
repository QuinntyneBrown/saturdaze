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

public sealed class ApproveSubmissionCommandHandler
    : IRequestHandler<ApproveSubmissionCommand, EventSubmissionDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public ApproveSubmissionCommandHandler(
        IAppDbContext db,
        ICurrentUserAccessor current,
        IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<EventSubmissionDto> Handle(ApproveSubmissionCommand request, CancellationToken ct)
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
            return EventSubmissionMapper.ToDto(submission, email);
        }

        if (submission.Status == EventSubmissionStatus.Rejected)
        {
            throw new ConflictException("submission_already_rejected");
        }

        var startsOn = DateOnly.FromDateTime(submission.StartsAtLocal);
        var endsOn = submission.EndsAtLocal.HasValue
            ? DateOnly.FromDateTime(submission.EndsAtLocal.Value)
            : startsOn;

        var published = new LocalEvent
        {
            Id = Guid.NewGuid(),
            Name = submission.Title,
            StartsOn = startsOn,
            EndsOn = endsOn,
            Location = submission.Location ?? string.Empty,
            DriveMinutes = submission.DriveMinutes ?? 0,
            Url = submission.SourceUrl ?? string.Empty,
            Category = submission.Category ?? string.Empty,
        };
        _db.LocalEvents.Add(published);

        submission.Status = EventSubmissionStatus.Approved;
        submission.ReviewedByUserId = adminId;
        submission.ReviewedAtUtc = _clock.UtcNow;
        submission.PublishedEventId = published.Id;

        await _db.SaveChangesAsync(ct);

        return EventSubmissionMapper.ToDto(submission, email);
    }
}
