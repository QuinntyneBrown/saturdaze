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
            var cs = sp.GetRequiredService<IConfiguration>().GetConnectionString("Saturdaze")
                ?? throw new InvalidOperationException("Connection string 'Saturdaze' is missing.");
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
