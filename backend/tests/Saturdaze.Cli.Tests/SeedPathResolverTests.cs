using FluentAssertions;
using Saturdaze.Cli.Seed;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class SeedPathResolverTests
{
    private static readonly string NoBundle = Path.Combine(Path.GetTempPath(), "sd-no-bundle-" + Guid.NewGuid());

    [Fact]
    public void Resolve_returns_override_when_provided()
    {
        var sut = new SeedPathResolver();
        var tmp = Path.Combine(Path.GetTempPath(), "sd-" + Guid.NewGuid());
        sut.Resolve(tmp).Should().Be(Path.GetFullPath(tmp));
    }

    [Fact]
    public void Resolve_reads_env_var_when_override_missing()
    {
        var tmp = Path.Combine(Path.GetTempPath(), "from-env");
        var sut = new SeedPathResolver(
            _ => "/should-not-be-used",
            name => name == "SATURDAZE_SEED_DIR" ? tmp : null);

        sut.Resolve(null).Should().Be(Path.GetFullPath(tmp));
    }

    [Fact]
    public void Resolve_prefers_the_bundled_data_over_the_user_scope_directory()
    {
        var bundle = Path.Combine(Path.GetTempPath(), "sd-bundle-" + Guid.NewGuid());
        Directory.CreateDirectory(bundle);
        try
        {
            var sut = new SeedPathResolver(
                sf => sf == Environment.SpecialFolder.ApplicationData ? @"C:\Users\test\AppData\Roaming" : "/home/test",
                _ => null,
                bundle);

            sut.Resolve(null).Should().Be(Path.GetFullPath(bundle));
            sut.BundleDirectory.Should().Be(bundle);
        }
        finally
        {
            Directory.Delete(bundle);
        }
    }

    [Fact]
    public void Resolve_falls_back_to_app_data_folder_when_no_bundle_ships()
    {
        var sut = new SeedPathResolver(
            sf => sf == Environment.SpecialFolder.ApplicationData ? @"C:\Users\test\AppData\Roaming" : "/home/test",
            _ => null,
            NoBundle);

        var resolved = sut.Resolve(null);
        resolved.Should().EndWith(Path.Combine(SeedPathResolver.FolderName, SeedPathResolver.SeedSubfolder));
        resolved.Should().Contain("AppData");
    }

    [Fact]
    public void Resolve_falls_back_to_user_profile_dot_config_when_app_data_blank()
    {
        var sut = new SeedPathResolver(
            sf => sf == Environment.SpecialFolder.UserProfile ? "/home/test" : string.Empty,
            _ => null,
            NoBundle);

        var resolved = sut.Resolve(null);
        resolved.Should().Contain(".config");
        resolved.Should().EndWith(Path.Combine(SeedPathResolver.FolderName, SeedPathResolver.SeedSubfolder));
    }

    [Fact]
    public void Resolve_treats_whitespace_override_as_missing()
    {
        var sut = new SeedPathResolver(
            _ => @"C:\AppData",
            _ => null,
            NoBundle);

        sut.Resolve("   ").Should().NotBe("   ");
    }
}
