using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Weather;
using Saturdaze.Infrastructure.Persistence;
using Saturdaze.Infrastructure.Weather;

namespace Saturdaze.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>((sp, opt) =>
        {
            var cfg = sp.GetRequiredService<IConfiguration>();
            // Honour the same env var the CLI uses so both the API and the
            // CLI binaries can be pointed at the same database with a
            // single environment variable.
            var cs = Environment.GetEnvironmentVariable("SATURDAZE_CONNECTION")
                ?? cfg.GetConnectionString("Saturdaze")
                ?? cfg["Saturdaze:ConnectionString"]
                ?? throw new InvalidOperationException(
                    "No connection string. Set SATURDAZE_CONNECTION, ConnectionStrings:Saturdaze, or Saturdaze:ConnectionString.");
            opt.UseSqlServer(cs, sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.GetName().Name));
        });

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddMemoryCache();

        services.Configure<HomeLocationOptions>(configuration.GetSection(HomeLocationOptions.SectionName));

        var weatherBaseUrl = configuration["Saturdaze:Weather:BaseUrl"]
            ?? "https://api.open-meteo.com/v1/";

        services
            .AddHttpClient<IWeatherClient, OpenMeteoWeatherClient>(OpenMeteoWeatherClient.HttpClientName, http =>
            {
                http.BaseAddress = new Uri(weatherBaseUrl, UriKind.Absolute);
                http.Timeout = TimeSpan.FromSeconds(10);
            })
            .AddStandardResilienceHandler();

        return services;
    }
}
