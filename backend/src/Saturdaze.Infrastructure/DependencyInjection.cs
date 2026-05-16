using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Infrastructure.Common;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Saturdaze")
            ?? throw new InvalidOperationException("Connection string 'Saturdaze' is missing.");

        services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(
            connectionString,
            sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.GetName().Name)));

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<ICurrentFamilyAccessor, SingleFamilyAccessor>();

        services.AddMemoryCache();

        return services;
    }
}
