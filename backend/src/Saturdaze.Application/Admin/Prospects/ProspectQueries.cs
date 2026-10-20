using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;

namespace Saturdaze.Application.Admin.Prospects;

/// <summary>Every prospect, newest first, without weekends (L2-159 AC5).</summary>
public sealed record ListProspectsQuery : IRequest<IReadOnlyList<ProspectDto>>;

public sealed class ListProspectsQueryHandler : IRequestHandler<ListProspectsQuery, IReadOnlyList<ProspectDto>>
{
    private readonly IAppDbContext _db;
    private readonly ProspectReader _reader;

    public ListProspectsQueryHandler(IAppDbContext db, ProspectReader reader)
    {
        _db = db;
        _reader = reader;
    }

    public async Task<IReadOnlyList<ProspectDto>> Handle(ListProspectsQuery request, CancellationToken ct)
    {
        var rows = await _db.Prospects.AsNoTracking()
            .OrderByDescending(p => p.CreatedAtUtc).ThenByDescending(p => p.Id)
            .ToListAsync(ct);
        return await _reader.ProjectAsync(rows, withWeekend: false, ct);
    }
}

/// <summary>One prospect with its weekend (L2-159 AC5).</summary>
public sealed record GetProspectQuery(Guid Id) : IRequest<ProspectDto>;

public sealed class GetProspectQueryHandler : IRequestHandler<GetProspectQuery, ProspectDto>
{
    private readonly ProspectReader _reader;
    public GetProspectQueryHandler(ProspectReader reader) => _reader = reader;

    public Task<ProspectDto> Handle(GetProspectQuery request, CancellationToken ct)
        => _reader.ReadAsync(request.Id, withWeekend: true, ct);
}
