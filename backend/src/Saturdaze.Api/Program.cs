using System.Text.Json.Serialization;
using Microsoft.OpenApi.Models;
using Saturdaze.Api.Middleware;
using Saturdaze.Application;
using Saturdaze.Infrastructure;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, services, cfg) => cfg
        .ReadFrom.Configuration(ctx.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File("logs/saturdaze-.log", rollingInterval: RollingInterval.Day));

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    builder.Services.AddControllers()
        .AddJsonOptions(opt =>
        {
            opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(o =>
    {
        o.SwaggerDoc("v1", new OpenApiInfo { Title = "Saturdaze API", Version = "v1" });
    });

    var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    builder.Services.AddCors(opt =>
    {
        opt.AddDefaultPolicy(p =>
        {
            if (corsOrigins.Length == 0)
            {
                p.SetIsOriginAllowed(_ => builder.Environment.IsDevelopment())
                 .AllowAnyHeader()
                 .AllowAnyMethod();
            }
            else
            {
                p.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod();
            }
        });
    });

    var app = builder.Build();

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseSerilogRequestLogging();
    app.UseCors();

    app.UseSwagger();
    app.UseSwaggerUI();

    app.MapControllers();

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Application terminated unexpectedly.");
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program;
