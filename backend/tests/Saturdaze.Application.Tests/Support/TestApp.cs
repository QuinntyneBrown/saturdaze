using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Common;

namespace Saturdaze.Application.Tests.Support;

/// <summary>
/// One TestApp = one isolated in-memory database. Disposable to keep tests independent.
/// </summary>
internal sealed class TestApp : IAsyncDisposable
{
    public TestAppDbContext Db { get; }
    public StubFamilyAccessor FamilyAccessor { get; } = new();

    private TestApp(TestAppDbContext db) => Db = db;

    public static TestApp Create()
    {
        var options = new DbContextOptionsBuilder<TestAppDbContext>()
            .UseInMemoryDatabase($"test-{Guid.NewGuid():N}")
            .Options;
        return new TestApp(new TestAppDbContext(options));
    }

    public async ValueTask DisposeAsync()
    {
        await Db.DisposeAsync();
    }
}

internal sealed class StubFamilyAccessor : ICurrentFamilyAccessor
{
    public Guid? FamilyId { get; set; }
    public Task<Guid> GetCurrentFamilyIdAsync(CancellationToken cancellationToken = default)
        => FamilyId is { } id
            ? Task.FromResult(id)
            : throw new Saturdaze.Application.Exceptions.NotFoundException("No family.");
}
