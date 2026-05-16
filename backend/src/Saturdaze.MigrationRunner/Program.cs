using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Infrastructure.Persistence;

var configuration = new ConfigurationBuilder()
    .SetBasePath(AppContext.BaseDirectory)
    .AddJsonFile("appsettings.json", optional: true)
    .AddEnvironmentVariables()
    .AddCommandLine(args)
    .Build();

var connectionString = configuration.GetConnectionString("Saturdaze")
    ?? configuration["Saturdaze:ConnectionString"]
    ?? Environment.GetEnvironmentVariable("SATURDAZE_CONNECTION")
    ?? throw new InvalidOperationException(
        "No connection string. Set ConnectionStrings:Saturdaze, Saturdaze:ConnectionString, or SATURDAZE_CONNECTION.");

var services = new ServiceCollection();
services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(
    connectionString,
    sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.GetName().Name)));

using var sp = services.BuildServiceProvider();
using var scope = sp.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

Console.WriteLine($"Applying migrations to: {SanitizeConnection(connectionString)}");
await db.Database.MigrateAsync();
Console.WriteLine("Migrations applied.");
return 0;

static string SanitizeConnection(string cs)
{
    var parts = cs.Split(';', StringSplitOptions.RemoveEmptyEntries);
    return string.Join(';', parts.Where(p => !p.TrimStart().StartsWith("Password", StringComparison.OrdinalIgnoreCase)));
}
