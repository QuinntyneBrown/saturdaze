using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Saturdaze.Cli.Database;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Migrate;

public sealed class MigrateCommandHandler
{
    private readonly AppDbContext _db;
    private readonly DatabaseOptions _options;
    private readonly ILogger<MigrateCommandHandler> _logger;

    public MigrateCommandHandler(
        AppDbContext db,
        DatabaseOptions options,
        ILogger<MigrateCommandHandler> logger)
    {
        _db = db;
        _options = options;
        _logger = logger;
    }

    public async Task<int> ExecuteAsync(CancellationToken ct)
    {
        var target = ConnectionStringSanitizer.Sanitize(_options.ConnectionString);
        _logger.LogInformation("Applying migrations to: {Target}", target);
        await _db.Database.MigrateAsync(ct);
        _logger.LogInformation("Migrations applied.");
        return 0;
    }
}
