using Microsoft.AspNetCore.Identity;
using Saturdaze.Application.Authentication;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Infrastructure.Authentication;

/// <summary>
/// Thin wrapper around `PasswordHasher{User}` so the rest of the app talks
/// to `IPasswordHasher` and never sees ASP.NET Identity types.
///
/// PBKDF2-SHA-256, 100k iterations, salt + version embedded in the output.
/// </summary>
public class Pbkdf2PasswordHasher : IPasswordHasher
{
    private static readonly PasswordHasher<User> _inner = new();
    private static readonly User _sentinel = new();

    public string Hash(string password) => _inner.HashPassword(_sentinel, password);

    public bool Verify(string hash, string password)
        => _inner.VerifyHashedPassword(_sentinel, hash, password) != PasswordVerificationResult.Failed;
}
