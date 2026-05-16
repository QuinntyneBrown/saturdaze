using Microsoft.Extensions.Logging;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Seed;

public sealed class SeedCommandHandler
{
    private readonly ISeedPathResolver _paths;
    private readonly IEnumerable<IJsonSeeder> _seeders;
    private readonly AppDbContext _db;
    private readonly ILogger<SeedCommandHandler> _logger;

    public SeedCommandHandler(
        ISeedPathResolver paths,
        IEnumerable<IJsonSeeder> seeders,
        AppDbContext db,
        ILogger<SeedCommandHandler> logger)
    {
        _paths = paths;
        _seeders = seeders;
        _db = db;
        _logger = logger;
    }

    public async Task<int> ExecuteAsync(string? overrideDir, CancellationToken ct)
    {
        var dir = _paths.Resolve(overrideDir);
        _logger.LogInformation("Seeding from {Directory}", dir);

        if (!Directory.Exists(dir))
        {
            _logger.LogError("Seed directory '{Directory}' does not exist.", dir);
            return 2;
        }

        var total = 0;
        var anyFound = false;

        foreach (var seeder in _seeders)
        {
            var file = Path.Combine(dir, seeder.FileName);
            if (!File.Exists(file))
            {
                _logger.LogWarning("Skipping {File} (not found).", seeder.FileName);
                continue;
            }

            anyFound = true;
            await using var stream = File.OpenRead(file);
            var rows = await seeder.SeedAsync(_db, stream, ct);
            _logger.LogInformation("Processed {Rows} record(s) from {File}.", rows, seeder.FileName);
            total += rows;
        }

        if (!anyFound)
        {
            _logger.LogError("No seed files found in {Directory}.", dir);
            return 3;
        }

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Seed complete. {Total} record(s) processed.", total);
        return 0;
    }
}
