using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Infrastructure.Common;

/// <summary>
/// V1 single-family implementation. Returns the lone seeded family's id.
/// The seam stays: handlers depend on the accessor, not on this implementation,
/// so multi-family auth can be added later without changing handler code.
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
            throw new NotFoundException("No family has been seeded.");
        _cached = firstId.Value;
        return _cached.Value;
    }
}
