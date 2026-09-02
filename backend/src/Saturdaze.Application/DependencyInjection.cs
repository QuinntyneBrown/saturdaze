using System.Reflection;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Application.Auth;
using Saturdaze.Application.Behaviors;
using Saturdaze.Application.Common;
using Saturdaze.Application.Planning;
using Saturdaze.Application.Weather;

namespace Saturdaze.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));
        services.AddValidatorsFromAssembly(assembly);
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddScoped<ICurrentFamilyAccessor, CurrentUserFamilyAccessor>();
        services.AddScoped<RefreshTokenIssuer>();
        services.AddScoped<WeekendForecastService>();
        services.AddScoped<PlannerInputLoader>();
        services.AddOptions<TimeOptions>();
        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddSingleton<IWeekendPlanner, WeekendPlanner>();
        return services;
    }
}
