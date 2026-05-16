using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Common;

/// <summary>
/// V1 single-family implementation. Returns the lone family's id from the database.
/// Handlers depend on the accessor; a header-based multi-family accessor can replace this
/// later without changing handler code.
/// </summary>
public sealed class SingleFamilyAccessor : ICurrentFamilyAccessor
{
    private readonly IAppDbContext _db;
    private Guid? _cached;

    public SingleFamilyAccessor(IAppDbContext db) => _db = db;

    public async Task<Guid> GetCurrentFamilyIdAsync(CancellationToken cancellationToken = default)
    {
        if (_cached is { } id) return id;
        var firstId = await _db.Families
            .OrderBy(f => f.HomeLocation)
            .Select(f => (Guid?)f.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (firstId is null)
            throw new NotFoundException("No family has been configured yet.");
        _cached = firstId.Value;
        return _cached.Value;
    }
}
