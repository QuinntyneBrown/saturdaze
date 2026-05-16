using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Application.Abstractions;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration _)
    {
        services.AddDbContext<AppDbContext>((sp, opt) =>
        {
            var cs = sp.GetRequiredService<IConfiguration>().GetConnectionString("Saturdaze")
                ?? throw new InvalidOperationException("Connection string 'Saturdaze' is missing.");
            opt.UseSqlServer(cs, sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.GetName().Name));
        });

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddMemoryCache();

        return services;
    }
}
