using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Saturdaze.Api.Authentication;
using Saturdaze.Api.Middleware;
using Saturdaze.Application;
using Saturdaze.Application.Authentication;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure;
using Saturdaze.Infrastructure.Authentication;
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

    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentUserAccessor, HttpContextCurrentUserAccessor>();

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

    // JWT bearer auth. SigningKey is read at handler-init time from JwtOptions
    // (DI), so the same key flows from config or env var.
    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(_ => { /* configured in PostConfigureOptions below */ });

    builder.Services.AddSingleton<IPostConfigureOptions<JwtBearerOptions>, JwtBearerPostConfigure>();

    builder.Services.AddAuthorization(o =>
    {
        o.AddPolicy("Admin", p => p.RequireRole(nameof(UserRole.Admin)));
    });

    var app = builder.Build();

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseSerilogRequestLogging();
    app.UseCors();

    app.UseAuthentication();
    app.UseAuthorization();

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

/// <summary>
/// Bridges `JwtOptions` (configured in Saturdaze.Infrastructure DI) into
/// `JwtBearerOptions` so the bearer middleware validates with the same
/// issuer/audience/key the token service uses to sign.
/// </summary>
file sealed class JwtBearerPostConfigure : IPostConfigureOptions<JwtBearerOptions>
{
    private readonly IOptions<JwtOptions> _jwt;
    private readonly IHostEnvironment _env;

    public JwtBearerPostConfigure(IOptions<JwtOptions> jwt, IHostEnvironment env)
    {
        _jwt = jwt;
        _env = env;
    }

    public void PostConfigure(string? name, JwtBearerOptions options)
    {
        if (name != JwtBearerDefaults.AuthenticationScheme) return;
        var j = _jwt.Value;
        options.RequireHttpsMetadata = !_env.IsDevelopment();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = j.Issuer,
            ValidAudience = j.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(j.SigningKey)),
            ClockSkew = TimeSpan.Zero,
        };
    }
}
