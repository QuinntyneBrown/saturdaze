using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Api.Tests.Support;

/// <summary>Which family the throwaway test user should belong to.</summary>
internal enum FamilyMode
{
    /// <summary>Re-point the user at the seeded Port Credit family (members, commitments, preferences).</summary>
    Seeded,
    /// <summary>Keep the empty family that registration created — an isolated second household.</summary>
    Own,
    /// <summary>Detach the user from any family (first-time profile setup path).</summary>
    None,
}

/// <summary>
/// Registers a throwaway user, adjusts its family/role directly in the
/// database, then signs in again so the bearer carries the final
/// <c>family_id</c> / role claims.
/// </summary>
internal static class SignedInClient
{
    public const string Password = "password123";
    public const string SeededFamilyHomeLocation = "Port Credit, Mississauga, ON";

    public sealed record Session(
        HttpClient Client,
        string Email,
        Guid UserId,
        Guid? FamilyId,
        string AccessToken,
        string RefreshToken);

    public static async Task<Session> CreateAsync(
        SaturdazeApiFactory factory,
        FamilyMode family = FamilyMode.Seeded,
        UserRole role = UserRole.User)
    {
        var anon = factory.CreateClient();
        var email = $"user-{Guid.NewGuid():N}@example.com";
        var register = await anon.PostAsJsonAsync("/api/auth/register", new AuthDtos.RegisterRequest(email, Password));
        register.EnsureSuccessStatusCode();

        Guid userId;
        Guid? familyId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = await db.Users.SingleAsync(u => u.NormalizedEmail == email.ToLowerInvariant());
            user.FamilyId = family switch
            {
                FamilyMode.Seeded => (await db.Families.SingleAsync(f => f.HomeLocation == SeededFamilyHomeLocation)).Id,
                FamilyMode.None => null,
                _ => user.FamilyId,
            };
            user.Role = role;
            await db.SaveChangesAsync();
            (userId, familyId) = (user.Id, user.FamilyId);
        }

        var login = await anon.PostAsJsonAsync("/api/auth/login", new AuthDtos.LoginRequest(email, Password));
        login.EnsureSuccessStatusCode();
        var body = (await login.Content.ReadFromJsonAsync<AuthDtos.AuthSuccess>())!;

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", body.Token.AccessToken);
        return new Session(client, email, userId, familyId, body.Token.AccessToken, body.Token.RefreshToken);
    }
}
