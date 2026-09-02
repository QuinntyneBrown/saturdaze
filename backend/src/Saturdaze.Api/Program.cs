using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
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

        // L2-008: every endpoint requires a bearer unless it opts out with
        // [AllowAnonymous]. The scheme is pinned so a future cookie/dev scheme
        // cannot silently satisfy the fallback.
        o.FallbackPolicy = new AuthorizationPolicyBuilder(JwtBearerDefaults.AuthenticationScheme)
            .RequireAuthenticatedUser()
            .Build();
    });

    var app = builder.Build();

    WarnOnMissingProductionConfig(app, corsOrigins);

    // Request logging sits outside the exception handler so the completion
    // event records the status the client actually received (401/404/409),
    // not a phantom 500 for every handled auth or validation failure.
    app.UseSerilogRequestLogging(o =>
    {
        // L2-039: every completion event carries the caller's user id when
        // authenticated — never the bearer itself.
        o.EnrichDiagnosticContext = (diagnostic, http) =>
        {
            var userId = http.User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                      ?? http.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId is not null) diagnostic.Set("UserId", userId);
        };
    });
    app.UseMiddleware<ExceptionHandlingMiddleware>();
    // Swagger is plain middleware (no endpoint), and the authorization
    // middleware applies the fallback policy even when there is no endpoint,
    // so it has to sit above UseAuthentication to stay reachable.
    if (!app.Environment.IsProduction())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseCors();

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Application terminated unexpectedly.");
    // A crash on boot must not look like a clean shutdown to the platform.
    Environment.ExitCode = 1;
}
finally
{
    Log.CloseAndFlush();
}

/// <summary>
/// L2-024 / L2-030 / L2-031: outside Development, warn loudly at startup when a
/// production-required value is unset or still holds its placeholder.
/// </summary>
static void WarnOnMissingProductionConfig(WebApplication app, string[] corsOrigins)
{
    if (app.Environment.IsDevelopment()) return;

    var jwt = app.Services.GetRequiredService<IOptions<JwtOptions>>().Value;
    if (string.IsNullOrWhiteSpace(jwt.SigningKey) || jwt.SigningKey.StartsWith("REPLACE_VIA_", StringComparison.Ordinal))
    {
        app.Logger.LogWarning(
            "JWT signing key is unset or still the placeholder. Set SATURDAZE_JWT_SIGNING_KEY before serving traffic.");
    }

    if (corsOrigins.Length == 0)
    {
        app.Logger.LogWarning(
            "Cors:AllowedOrigins is empty; browsers on other origins will be rejected outside Development.");
    }
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
