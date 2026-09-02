using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Saturdaze.Cli.Database;
using Saturdaze.Cli.Seed;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Reset;

public sealed class ResetCommandHandler
{
    private readonly AppDbContext _db;
    private readonly DatabaseOptions _options;
    private readonly SeedCommandHandler _seed;
    private readonly ILogger<ResetCommandHandler> _logger;

    public ResetCommandHandler(
        AppDbContext db,
        DatabaseOptions options,
        SeedCommandHandler seed,
        ILogger<ResetCommandHandler> logger)
    {
        _db = db;
        _options = options;
        _seed = seed;
        _logger = logger;
    }

    public async Task<int> ExecuteAsync(string? seedDir, CancellationToken ct)
    {
        var target = ConnectionStringSanitizer.Sanitize(_options.ConnectionString);
        _logger.LogWarning("Resetting database: {Target}", target);

        await _db.Database.EnsureDeletedAsync(ct);

        if (_db.Database.IsRelational())
        {
            await _db.Database.MigrateAsync(ct);
        }
        else
        {
            await _db.Database.EnsureCreatedAsync(ct);
        }

        _logger.LogInformation("Database schema is current.");
        return await _seed.ExecuteAsync(seedDir, ct);
    }
}
