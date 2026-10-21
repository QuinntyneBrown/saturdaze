using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Support;

/// <summary>
/// Boots the API in-process against a per-fixture in-memory SQLite database (ADR-020).
/// The API creates the schema on startup; the database goes when the fixture is disposed.
/// </summary>
public sealed class SaturdazeApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public string DatabaseName { get; } = $"Saturdaze_Api_{Guid.NewGuid():N}";

    /// <summary>A named shared-cache database: every DbContext the API opens reaches the same one.</summary>
    public string ConnectionString => $"Data Source={DatabaseName};Mode=Memory;Cache=Shared";

    /// <summary>An in-memory SQLite database lives as long as one connection to it is open.</summary>
    private SqliteConnection? _keepAlive;

    public FakeWeatherClient Weather { get; } = new();
    public FakeDateTimeProvider Clock { get; } = new(new DateOnly(2026, 5, 16));
    public CapturingLogSink Logs { get; } = new();
    public FakeRemoteImageFetcher Images { get; } = new();
    public CapturingEmailSender Mail { get; } = new();
    public FakeGoogleIdTokenVerifier Google { get; } = new();

    /// <summary>Where uploaded covers go for this fixture (deleted on disposal).</summary>
    public string PhotoDirectory { get; } = Path.Combine(Path.GetTempPath(), "saturdaze-photos-" + Guid.NewGuid().ToString("N"));

    /// <summary>Where curated uploads go (ADR-015); inside <see cref="PhotoDirectory"/> so disposal removes it.</summary>
    public string CuratedPhotoDirectory => Path.Combine(PhotoDirectory, "curated");

    /// <summary>The curated store's public origin: the allow-listed test origin, so uploads project.</summary>
    public const string CuratedPublicOrigin = "https://images.example.com";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, cfg) =>
        {
            cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Saturdaze"] = ConnectionString,
                [Saturdaze.Infrastructure.DependencyInjection.DatabaseProviderKey] = "Sqlite",
                ["Saturdaze:HomeLocation:Name"] = "Port Credit",
                ["Saturdaze:HomeLocation:Latitude"] = "43.5547",
                ["Saturdaze:HomeLocation:Longitude"] = "-79.5816",
                ["Saturdaze:Jwt:Issuer"] = "saturdaze-test",
                ["Saturdaze:Jwt:Audience"] = "saturdaze-test-clients",
                ["Saturdaze:Jwt:SigningKey"] = "test-only-signing-key-must-be-at-least-32-bytes-long",
                ["Saturdaze:Jwt:AccessTokenMinutes"] = "15",
                ["Saturdaze:Images:AllowedOrigins:0"] = "https://images.example.com",
                ["Saturdaze:Photos:Directory"] = PhotoDirectory,
                ["Saturdaze:Photos:SigningKey"] = "test-only-photo-signing-key-at-least-32-bytes",
                ["Saturdaze:CuratedPhotos:Directory"] = CuratedPhotoDirectory,
                ["Saturdaze:CuratedPhotos:PublicOrigin"] = CuratedPublicOrigin,
                ["Saturdaze:Share:AppOrigin"] = "https://app.example.com",
            });
        });
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<Saturdaze.Application.Weather.IWeatherClient>();
            services.AddSingleton<Saturdaze.Application.Weather.IWeatherClient>(Weather);
            services.RemoveAll<Saturdaze.Application.Common.IDateTimeProvider>();
            services.AddSingleton<Saturdaze.Application.Common.IDateTimeProvider>(Clock);
            services.AddSingleton<Serilog.Core.ILogEventSink>(Logs);
            services.RemoveAll<Saturdaze.Application.Photos.IRemoteImageFetcher>();
            services.AddSingleton<Saturdaze.Application.Photos.IRemoteImageFetcher>(Images);
            services.RemoveAll<Saturdaze.Application.Email.IEmailSender>();
            services.AddSingleton<Saturdaze.Application.Email.IEmailSender>(Mail);
            services.RemoveAll<Saturdaze.Application.Authentication.IGoogleIdTokenVerifier>();
            services.AddSingleton<Saturdaze.Application.Authentication.IGoogleIdTokenVerifier>(Google);
        });
    }

    public async Task InitializeAsync()
    {
        _keepAlive = new SqliteConnection(ConnectionString);
        await _keepAlive.OpenAsync();
        // Building the host creates the schema; then seed for tests that need a family / catalog.
        // Pipeline tests will tolerate the extra data.
        await using var scope = Services.CreateAsyncScope();
        await TestSeed.SeedAsync(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        if (Directory.Exists(PhotoDirectory)) Directory.Delete(PhotoDirectory, recursive: true);
        await base.DisposeAsync();
        if (_keepAlive is not null) await _keepAlive.DisposeAsync();
    }
}
