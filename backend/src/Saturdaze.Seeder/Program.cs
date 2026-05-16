using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Infrastructure.Persistence;
using Saturdaze.Infrastructure.SeedData;

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
services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(connectionString));

using var sp = services.BuildServiceProvider();
using var scope = sp.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

Console.WriteLine("Seeding catalog and family profile (idempotent)...");
await SeedDataLoader.SeedAsync(db);
Console.WriteLine("Seed complete.");
return 0;
