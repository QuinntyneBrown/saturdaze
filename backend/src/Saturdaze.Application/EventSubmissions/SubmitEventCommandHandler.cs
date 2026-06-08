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

public sealed class SubmitEventCommandHandler
    : IRequestHandler<SubmitEventCommand, EventSubmissionDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public SubmitEventCommandHandler(
        IAppDbContext db,
        ICurrentUserAccessor current,
        IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<EventSubmissionDto> Handle(SubmitEventCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();
        var email = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.Email)
            .FirstOrDefaultAsync(ct);

        var submission = new EventSubmission
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            StartsAtLocal = request.StartsAtLocal,
            EndsAtLocal = request.EndsAtLocal,
            Location = Trim(request.Location),
            Description = Trim(request.Description),
            CostNote = Trim(request.CostNote),
            AgeRange = Trim(request.AgeRange),
            SourceUrl = Trim(request.SourceUrl),
            Category = Trim(request.Category),
            Status = EventSubmissionStatus.Pending,
            SubmittedByUserId = userId,
            SubmittedAtUtc = _clock.UtcNow,
        };

        _db.EventSubmissions.Add(submission);
        await _db.SaveChangesAsync(ct);

        return EventSubmissionMapper.ToDto(submission, email);
    }

    private static string? Trim(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
