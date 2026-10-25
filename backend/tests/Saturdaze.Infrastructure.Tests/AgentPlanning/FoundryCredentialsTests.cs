// Acceptance Test
// Traces to: L2-213 AC1, AC2, AC3
// Description: Agent planning reaches Foundry with a managed-identity token or the account key, and fails lazily when unconfigured.

using Azure.Core;
using FluentAssertions;
using Microsoft.Extensions.AI;
using Saturdaze.Application.AgentPlanning;
using Saturdaze.Infrastructure.AgentPlanning;
using Xunit;

namespace Saturdaze.Infrastructure.Tests.AgentPlanning;

public class FoundryCredentialsTests
{
    private sealed class FixedToken : TokenCredential
    {
        public List<string[]> Scopes { get; } = new();

        public override AccessToken GetToken(TokenRequestContext requestContext, CancellationToken cancellationToken)
        {
            Scopes.Add(requestContext.Scopes);
            return new AccessToken("mi-token", DateTimeOffset.UtcNow.AddHours(1));
        }

        public override ValueTask<AccessToken> GetTokenAsync(TokenRequestContext requestContext, CancellationToken cancellationToken)
            => ValueTask.FromResult(GetToken(requestContext, cancellationToken));
    }

    private static HttpRequestMessage Request() => new(HttpMethod.Post, "https://sd-ai-test.services.ai.azure.com/anthropic/v1/messages");

    [Fact]
    public void Managed_identity_sends_an_entra_bearer_token_for_foundry_and_no_key()
    {
        // Traces to: L2-213 AC1
        var token = new FixedToken();
        var options = new AgentPlanningOptions { Auth = AgentAuth.ManagedIdentity, FoundryResource = "sd-ai-test" };

        var credentials = AgentPlanningServiceCollectionExtensions.Credentials(options, _ => "should-not-be-used", token)!;
        var request = Request();
        credentials.Apply(request);

        request.Headers.Authorization!.Scheme.Should().BeEquivalentTo("Bearer");
        request.Headers.Authorization.Parameter.Should().Be("mi-token");
        request.Headers.Contains("x-api-key").Should().BeFalse();
        token.Scopes.Should().ContainSingle().Which.Should().Equal("https://ai.azure.com/.default");
    }

    [Fact]
    public void Key_auth_sends_the_account_key_and_no_bearer()
    {
        // Traces to: L2-213 AC2
        var options = new AgentPlanningOptions { Auth = AgentAuth.Key, FoundryResource = "sd-ai-test" };

        var credentials = AgentPlanningServiceCollectionExtensions.Credentials(
            options, name => name == "ANTHROPIC_FOUNDRY_API_KEY" ? "foundry-key" : null, credential: null)!;
        var request = Request();
        credentials.Apply(request);

        request.Headers.GetValues("x-api-key").Should().Equal("foundry-key");
        request.Headers.Authorization.Should().BeNull();
    }

    [Theory]
    [InlineData("", AgentAuth.Key, "key")]
    [InlineData("sd-ai-test", AgentAuth.Key, null)]
    public async Task An_unconfigured_endpoint_fails_on_first_use_not_at_startup(string resource, AgentAuth auth, string? key)
    {
        // Traces to: L2-213 AC3
        var options = new AgentPlanningOptions { Auth = auth, FoundryResource = resource };

        var client = AgentPlanningServiceCollectionExtensions.CreateChatClient(options, _ => key, credential: null);

        client.Should().NotBeNull();
        var call = () => client.GetResponseAsync("hello");
        await call.Should().ThrowAsync<InvalidOperationException>().WithMessage("Agent planning is not configured*");
    }
}
