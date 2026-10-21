// Acceptance Test
// Traces to: L2-080 AC7
// Description: Two ingestion passes for the same type take turns at the daily-budget check.

using FluentAssertions;
using Saturdaze.Infrastructure.Tests.Support;
using Xunit;

namespace Saturdaze.Infrastructure.Tests.Persistence;

/// <summary>The lock is SQL Server's <c>sp_getapplock</c>; other providers take none (ADR-020).</summary>
[Trait("Category", "SqlServer")]
public class IngestionLockTests : IAsyncLifetime
{
    private SqlServerTestDatabase _db = null!;

    public async Task InitializeAsync()
    {
        if (LocalDbConnection.Enabled) _db = await SqlServerTestDatabase.CreateAsync();
    }

    public async Task DisposeAsync()
    {
        if (LocalDbConnection.Enabled) await _db.DisposeAsync();
    }

    [SqlServerFact]
    public async Task A_second_holder_waits_until_the_first_releases_the_lock()
    {
        await using var first = _db.CreateContext();
        await using var second = _db.CreateContext();

        var held = await first.AcquireLockAsync("saturdaze-ingestion-Events");
        var waiting = second.AcquireLockAsync("saturdaze-ingestion-Events");

        (await Task.WhenAny(waiting, Task.Delay(TimeSpan.FromSeconds(1)))).Should().NotBeSameAs(waiting,
            "the second pass must wait while the first holds the lock");

        await held.DisposeAsync();
        var acquired = await waiting.WaitAsync(TimeSpan.FromSeconds(10));
        await acquired.DisposeAsync();
    }

    [SqlServerFact]
    public async Task Different_types_do_not_wait_for_each_other()
    {
        await using var first = _db.CreateContext();
        await using var second = _db.CreateContext();

        await using var events = await first.AcquireLockAsync("saturdaze-ingestion-Events");
        var restaurants = await second.AcquireLockAsync("saturdaze-ingestion-Restaurants")
            .WaitAsync(TimeSpan.FromSeconds(5));
        await restaurants.DisposeAsync();
    }
}
