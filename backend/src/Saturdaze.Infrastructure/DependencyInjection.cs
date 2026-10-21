using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Calendar;
using Saturdaze.Application.Email;
using Saturdaze.Application.Weather;
using Saturdaze.Infrastructure.Authentication;
using Saturdaze.Infrastructure.Calendar;
using Saturdaze.Infrastructure.Email;
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
            if (UsesSqlite(cfg))
                opt.UseSqlite(cs);
            else
                opt.UseSqlServer(cs, sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.GetName().Name));
        });

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddMemoryCache();

        services.Configure<HomeLocationOptions>(configuration.GetSection(HomeLocationOptions.SectionName));
        services.Configure<Saturdaze.Application.Photos.ImageOptions>(
            configuration.GetSection(Saturdaze.Application.Photos.ImageOptions.SectionName));
        services.Configure<Saturdaze.Application.Photos.PhotoOptions>(
            configuration.GetSection(Saturdaze.Application.Photos.PhotoOptions.SectionName));
        services.AddSingleton<Saturdaze.Application.Photos.IPhotoStore, Photos.FileSystemPhotoStore>();
        services.AddSingleton<Saturdaze.Application.Photos.IPhotoUrlSigner, Photos.HmacPhotoUrlSigner>();
        services.AddSingleton<Saturdaze.Application.Photos.IImageSanitizer, Photos.SkiaImageSanitizer>();
        services.Configure<Saturdaze.Application.Photos.CuratedPhotoOptions>(
            configuration.GetSection(Saturdaze.Application.Photos.CuratedPhotoOptions.SectionName));
        services.AddSingleton<Saturdaze.Application.Photos.ICuratedPhotoStore, Photos.FileSystemCuratedPhotoStore>();
        // One verification fetch per URL add (L2-116): no retries, the fetcher owns the 10 s budget.
        services.AddHttpClient(Photos.HttpRemoteImageFetcher.HttpClientName, http =>
        {
            http.Timeout = Photos.HttpRemoteImageFetcher.Timeout;
            http.MaxResponseContentBufferSize = Photos.HttpRemoteImageFetcher.MaxBytes;
        });
        services.AddSingleton<Saturdaze.Application.Photos.IRemoteImageFetcher, Photos.HttpRemoteImageFetcher>();
        services.Configure<Application.Common.TimeOptions>(configuration.GetSection(Application.Common.TimeOptions.SectionName));

        // Auth. Signing key resolution: env var first (production), config
        // section as fallback for dev. A startup warning fires outside
        // Development if the placeholder is still in play.
        services.Configure<JwtOptions>(o =>
        {
            configuration.GetSection(JwtOptions.SectionName).Bind(o);
            var envKey = Environment.GetEnvironmentVariable("SATURDAZE_JWT_SIGNING_KEY");
            if (!string.IsNullOrWhiteSpace(envKey)) o.SigningKey = envKey;
        });

        services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();

        // Sign in with Google (ADR-019): the credential is verified offline
        // against Google's published keys; the only setting is the client id.
        services.Configure<GoogleOptions>(configuration.GetSection(GoogleOptions.SectionName));
        services.AddHttpClient(GoogleIdTokenVerifier.HttpClientName, http =>
        {
            http.Timeout = TimeSpan.FromSeconds(10);
        });
        services.AddSingleton<IGoogleIdTokenVerifier, GoogleIdTokenVerifier>();

        // Calendar sync (ADR-021): the authorization code grant, refresh tokens
        // encrypted with Data Protection, and the Calendar API.
        services.Configure<CalendarOptions>(o =>
        {
            configuration.GetSection(CalendarOptions.SectionName).Bind(o);
            if (string.IsNullOrWhiteSpace(o.AppOrigin)) o.AppOrigin = configuration["Saturdaze:Share:AppOrigin"];
        });
        var dataProtection = services.AddDataProtection().SetApplicationName("Saturdaze");
        var keyDirectory = configuration[$"{CalendarOptions.SectionName}:KeyDirectory"];
        if (!string.IsNullOrWhiteSpace(keyDirectory))
            dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keyDirectory));
        services.AddSingleton<ICalendarTokenProtector, DataProtectionCalendarTokenProtector>();
        services.AddHttpClient(GoogleCalendarClient.HttpClientName, http =>
        {
            http.Timeout = TimeSpan.FromSeconds(10);
        });
        services.AddSingleton<IGoogleCalendarClient, GoogleCalendarClient>();
        services.AddSingleton<CalendarSyncSignal>();
        services.AddSingleton<ICalendarSyncSignal>(sp => sp.GetRequiredService<CalendarSyncSignal>());
        services.AddHostedService<CalendarSyncService>();

        // Account mail (L2-142): handlers enqueue, a hosted dispatcher sends after the
        // response. SMTP when a host is configured, otherwise .eml files on disk.
        services.Configure<EmailOptions>(o =>
        {
            configuration.GetSection(EmailOptions.SectionName).Bind(o);
            if (string.IsNullOrWhiteSpace(o.AppOrigin)) o.AppOrigin = configuration["Saturdaze:Share:AppOrigin"];
        });
        services.AddSingleton<EmailOutbox>();
        services.AddSingleton<IEmailOutbox>(sp => sp.GetRequiredService<EmailOutbox>());
        services.AddHostedService<EmailDispatchService>();
        if (string.IsNullOrWhiteSpace(configuration[$"{EmailOptions.SectionName}:SmtpHost"]))
            services.AddSingleton<IEmailSender, PickupDirectoryEmailSender>();
        else
            services.AddSingleton<IEmailSender, SmtpEmailSender>();
        services.AddSingleton<AccountEmails>();
        services.AddSingleton<InvitationEmails>();
        services.AddSingleton<SuggestionEmails>();

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

    /// <summary>The configuration key that selects the database provider (ADR-020).</summary>
    public const string DatabaseProviderKey = "Saturdaze:Database:Provider";

    /// <summary>
    /// True when <see cref="DatabaseProviderKey"/> selects SQLite, the provider the API
    /// tests and the e2e API run on (ADR-020). SQL Server, when unset, is the only
    /// provider for development and production; any other value is a configuration error.
    /// </summary>
    public static bool UsesSqlite(IConfiguration configuration)
    {
        var provider = configuration[DatabaseProviderKey];
        if (string.IsNullOrWhiteSpace(provider) || provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
            return false;
        if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
            return true;
        throw new InvalidOperationException($"Unknown {DatabaseProviderKey} '{provider}'. Use SqlServer or Sqlite.");
    }

    /// <summary>
    /// Creates the SQLite schema from the model when it does not exist yet. The migrations
    /// are SQL Server's, so SQLite gets the model's tables plus the one thing the model
    /// cannot express: an insert trigger that numbers photo audit entries like SQL
    /// Server's identity column (ADR-020).
    /// </summary>
    public static async Task EnsureSqliteSchemaAsync(this AppDbContext db, CancellationToken cancellationToken = default)
    {
        if (!await db.Database.EnsureCreatedAsync(cancellationToken)) return;
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TRIGGER "PhotoAuditEntries_Sequence" AFTER INSERT ON "PhotoAuditEntries"
            BEGIN
                UPDATE "PhotoAuditEntries" SET "Sequence" = NEW.rowid WHERE rowid = NEW.rowid;
            END
            """,
            cancellationToken);
    }
}
