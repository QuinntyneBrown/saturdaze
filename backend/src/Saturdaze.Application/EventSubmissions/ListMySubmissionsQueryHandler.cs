using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.EventSubmissions;

public sealed class ListMySubmissionsQueryHandler
    : IRequestHandler<ListMySubmissionsQuery, IReadOnlyList<EventSubmissionDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;

    public ListMySubmissionsQueryHandler(IAppDbContext db, ICurrentUserAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<EventSubmissionDto>> Handle(ListMySubmissionsQuery request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        var email = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.Email)
            .FirstOrDefaultAsync(ct);

        var rows = await _db.EventSubmissions.AsNoTracking()
            .Where(s => s.SubmittedByUserId == userId)
            .OrderByDescending(s => s.SubmittedAtUtc)
            .ToListAsync(ct);

        return rows.Select(s => EventSubmissionMapper.ToDto(s, email)).ToList();
    }
}
