using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Seed;

public interface IJsonSeeder
{
    string FileName { get; }
    Task<int> SeedAsync(AppDbContext db, Stream json, CancellationToken ct);
}
