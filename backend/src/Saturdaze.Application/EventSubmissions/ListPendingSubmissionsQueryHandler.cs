using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.EventSubmissions;

public sealed class ListPendingSubmissionsQueryHandler
    : IRequestHandler<ListPendingSubmissionsQuery, IReadOnlyList<EventSubmissionDto>>
{
    private readonly IAppDbContext _db;

    public ListPendingSubmissionsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<EventSubmissionDto>> Handle(ListPendingSubmissionsQuery request, CancellationToken ct)
    {
        var rows = await (
            from s in _db.EventSubmissions.AsNoTracking()
            where s.Status == EventSubmissionStatus.Pending
            join u in _db.Users.AsNoTracking() on s.SubmittedByUserId equals u.Id into uj
            from u in uj.DefaultIfEmpty()
            orderby s.SubmittedAtUtc ascending
            select new { Submission = s, Email = u != null ? u.Email : null })
            .ToListAsync(ct);

        return rows.Select(r => EventSubmissionMapper.ToDto(r.Submission, r.Email)).ToList();
    }
}
