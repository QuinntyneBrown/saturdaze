using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Tests;

internal static class TestDb
{
    private static readonly ConcurrentDictionary<string, InMemoryDatabaseRoot> Roots = new();

    public static AppDbContext Create() => Create("test-" + Guid.NewGuid());

    public static AppDbContext Create(string name)
    {
        var root = Roots.GetOrAdd(name, _ => new InMemoryDatabaseRoot());
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(name, root)
            .Options;
        return new AppDbContext(opts);
    }
}
