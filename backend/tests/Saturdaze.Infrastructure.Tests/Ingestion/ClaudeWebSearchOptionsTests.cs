using FluentAssertions;
using Saturdaze.Infrastructure.Ingestion;
using Xunit;

namespace Saturdaze.Infrastructure.Tests.Ingestion;

public class ClaudeWebSearchOptionsTests
{
    [Fact]
    public void Foundry_base_uri_is_built_from_the_resource_name()
    {
        var options = new ClaudeWebSearchOptions { Provider = ClaudeProvider.Foundry, FoundryResource = "sd-ai-uofnt2" };

        ClaudeWebSearchOptions.ResolveBaseUri(options)!.AbsoluteUri
            .Should().Be("https://sd-ai-uofnt2.services.ai.azure.com/anthropic/");
    }

    [Fact]
    public void Anthropic_base_uri_defaults_to_the_public_api()
    {
        var options = new ClaudeWebSearchOptions { Provider = ClaudeProvider.Anthropic };

        ClaudeWebSearchOptions.ResolveBaseUri(options)!.AbsoluteUri.Should().Be("https://api.anthropic.com/");
    }

    [Fact]
    public void Explicit_base_url_wins_and_gains_a_trailing_slash()
    {
        var options = new ClaudeWebSearchOptions
        {
            Provider = ClaudeProvider.Foundry,
            FoundryResource = "ignored",
            BaseUrl = "https://custom.services.ai.azure.com/anthropic"
        };

        var uri = ClaudeWebSearchOptions.ResolveBaseUri(options)!;

        uri.AbsoluteUri.Should().Be("https://custom.services.ai.azure.com/anthropic/");
        new Uri(uri, "v1/messages").AbsolutePath.Should().Be("/anthropic/v1/messages");
    }

    [Fact]
    public void Foundry_without_a_resource_or_base_url_resolves_to_null()
    {
        var options = new ClaudeWebSearchOptions { Provider = ClaudeProvider.Foundry };

        ClaudeWebSearchOptions.ResolveBaseUri(options).Should().BeNull();
    }

    [Fact]
    public void Foundry_key_comes_from_its_own_variable_and_ignores_ANTHROPIC_API_KEY()
    {
        var env = new Dictionary<string, string?>
        {
            ["ANTHROPIC_API_KEY"] = "sk-ant-direct",
            ["ANTHROPIC_FOUNDRY_API_KEY"] = "foundry-key"
        };
        var foundry = new ClaudeWebSearchOptions { Provider = ClaudeProvider.Foundry, ApiKey = "configured" };
        var anthropic = new ClaudeWebSearchOptions { Provider = ClaudeProvider.Anthropic, ApiKey = "configured" };

        ClaudeWebSearchOptions.ResolveApiKey(foundry, Lookup(env)).Should().Be("foundry-key");
        ClaudeWebSearchOptions.ResolveApiKey(anthropic, Lookup(env)).Should().Be("sk-ant-direct");
    }

    [Fact]
    public void Configured_key_is_used_when_the_provider_variable_is_blank()
    {
        var env = new Dictionary<string, string?> { ["ANTHROPIC_API_KEY"] = "sk-ant-direct", ["ANTHROPIC_FOUNDRY_API_KEY"] = " " };
        var options = new ClaudeWebSearchOptions { Provider = ClaudeProvider.Foundry, ApiKey = "configured" };

        ClaudeWebSearchOptions.ResolveApiKey(options, Lookup(env)).Should().Be("configured");
    }

    private static Func<string, string?> Lookup(IReadOnlyDictionary<string, string?> env)
        => name => env.TryGetValue(name, out var value) ? value : null;
}
