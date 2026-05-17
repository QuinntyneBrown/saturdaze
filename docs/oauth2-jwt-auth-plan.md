# OAuth2 + JWT Implementation Plan

Scope: local-only auth (no external IdP), self-signup with email/password, persisted+rotated refresh tokens, User/Admin roles. The plan honors the project's "radically simple" Clean Architecture, MediatR, 1-type-per-file, no-repositories rules.

## 1. Packages (add to `backend/Directory.Packages.props`)

| Package | Where consumed |
|---|---|
| `Microsoft.AspNetCore.Authentication.JwtBearer` (10.0.0) | `Saturdaze.Api` |
| `Microsoft.IdentityModel.Tokens` (8.x — transitive but pin) | `Saturdaze.Infrastructure` |
| `System.IdentityModel.Tokens.Jwt` (8.x) | `Saturdaze.Infrastructure` |
| `Microsoft.Extensions.Identity.Core` (10.0.0) | `Saturdaze.Infrastructure` (just for `PasswordHasher<T>` — not full ASP.NET Identity) |

No ASP.NET Core Identity, no OpenIddict, no Duende. Hand-rolled around battle-tested primitives.

## 2. Domain (`Saturdaze.Domain`)

- `Enums/UserRole.cs` — `User`, `Admin`
- `Entities/User.cs` — `Id`, `Email`, `NormalizedEmail`, `PasswordHash`, `Role`, `CreatedAtUtc`, `UpdatedAtUtc`, optional `FamilyId`
- `Entities/RefreshToken.cs` — `Id`, `UserId`, `TokenHash` (SHA-256 of raw token; raw never stored), `ExpiresAtUtc`, `CreatedAtUtc`, `RevokedAtUtc?`, `ReplacedByTokenId?`, optional `CreatedByIp`/`RevokedByIp`

## 3. Persistence (`Saturdaze.Infrastructure/Persistence/Configurations`)

- `UserConfiguration.cs` — table `Users`, unique index on `NormalizedEmail`, max-length 256
- `RefreshTokenConfiguration.cs` — table `RefreshTokens`, indexed `TokenHash` (unique), FK to `Users` with cascade

Extend `IAppDbContext` and `AppDbContext` with `DbSet<User> Users` and `DbSet<RefreshToken> RefreshTokens`.

Add migration `AddAuth` (via `dotnet ef migrations add AddAuth -p src/Saturdaze.Infrastructure -s src/Saturdaze.Api`).

## 4. Application contracts (`Saturdaze.Application`)

**New folder `Auth/`** (mirrors `Families/`, `Activities/`):

Commands + handlers + FluentValidation validators:
- `RegisterUserCommand` → `(email, password)` → `AuthTokensDto`
- `LoginCommand` → `(email, password)` → `AuthTokensDto`
- `RefreshTokenCommand` → `(refreshToken)` → `AuthTokensDto`
- `RevokeTokenCommand` → `(refreshToken)` → `Unit` (logout)

Queries:
- `GetCurrentUserQuery` → `UserDto`

DTOs (in `Auth/` or `Contracts/`):
- `AuthTokensDto` — `accessToken`, `refreshToken`, `accessTokenExpiresAtUtc`, `tokenType = "Bearer"`
- `UserDto` — `id`, `email`, `role`

Exceptions (in `Exceptions/`):
- `InvalidCredentialsException` (maps to 401)
- `EmailAlreadyExistsException` (maps to 409, reuses `ConflictException`)

**New abstractions** (`Application/Authentication/`):
- `IPasswordHasher` — `Hash(password)`, `Verify(hash, password)`
- `IJwtTokenService` — `string CreateAccessToken(User)`, `DateTimeOffset AccessTokenExpiresAt`, `string CreateRawRefreshToken()`, `string HashRefreshToken(string raw)`
- `ICurrentUserAccessor` — `Guid? UserId`, `string? Email`, `UserRole? Role`, `bool IsAuthenticated`

## 5. Infrastructure implementations (`Saturdaze.Infrastructure/Authentication/`)

- `Pbkdf2PasswordHasher.cs` — wraps `Microsoft.AspNetCore.Identity.PasswordHasher<User>` (PBKDF2-SHA-256, 100k iter, embedded salt+version)
- `JwtOptions.cs` — `Issuer`, `Audience`, `SigningKey`, `AccessTokenMinutes` (default 15), `RefreshTokenDays` (default 14)
- `JwtTokenService.cs` — builds JWT with claims `sub` (UserId), `email`, `role`, `jti`, `iat`, `exp`; HMAC-SHA-256 signed; generates 32-byte cryptographically random refresh token (`RandomNumberGenerator`) returned base64url; hashes via SHA-256 before persistence

Register all three in `Infrastructure.DependencyInjection.AddInfrastructure`. Bind `JwtOptions` from `Saturdaze:Jwt`, with env-var override `SATURDAZE_JWT_SIGNING_KEY` (same pattern as the connection string).

## 6. API layer (`Saturdaze.Api`)

- `Controllers/AuthController.cs` (`[ApiController] [Route("api/auth")] [AllowAnonymous]` at class level; `[Authorize]` on `Me` and `Logout`):
  - `POST /api/auth/register` → `RegisterUserCommand`
  - `POST /api/auth/login` → `LoginCommand`
  - `POST /api/auth/refresh` → `RefreshTokenCommand`
  - `POST /api/auth/logout` → `RevokeTokenCommand` (`[Authorize]`)
  - `GET  /api/auth/me` → `GetCurrentUserQuery` (`[Authorize]`)
- `Authentication/HttpContextCurrentUserAccessor.cs` — implements `ICurrentUserAccessor` over `IHttpContextAccessor.HttpContext.User`
- Update `ExceptionHandlingMiddleware`: add `InvalidCredentialsException` → 401

**`Program.cs` additions** (after `AddInfrastructure`, before `Build()`):
- `builder.Services.AddHttpContextAccessor();`
- `builder.Services.AddScoped<ICurrentUserAccessor, HttpContextCurrentUserAccessor>();`
- `builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => { o.TokenValidationParameters = ... })` — issuer/audience/key from `JwtOptions`, `ValidateLifetime = true`, `ClockSkew = TimeSpan.Zero`
- `builder.Services.AddAuthorization(o => o.AddPolicy("Admin", p => p.RequireRole(nameof(UserRole.Admin))));`
- `app.UseAuthentication();` then `app.UseAuthorization();` placed **after** `UseCors()` and **before** `MapControllers()`

Apply `[Authorize]` to existing controllers (`Family`, `Activities`, `Restaurants`, `Blocks`, `Errands`, `Events`, `Weather`, `Weekends`). Leave `PingController` anonymous (smoke test).

## 7. Refresh token rotation algorithm (`RefreshTokenCommandHandler`)

1. Hash the incoming raw token; look up `RefreshToken` by `TokenHash`.
2. If missing → 401.
3. If `RevokedAtUtc != null` → **token reuse detected**: revoke entire chain for that user (`Users.Where(...).RefreshTokens` → mark all revoked) and 401. This is the standard mitigation for stolen refresh tokens.
4. If `ExpiresAtUtc <= UtcNow` → 401.
5. Generate new raw refresh token + hash; insert new `RefreshToken`; mark old `RevokedAtUtc = UtcNow, ReplacedByTokenId = newId`.
6. Mint new access token; return both.

`SaveChangesAsync` is on `IAppDbContext` — single transaction.

## 8. Security checklist

- Generic `"Invalid email or password"` on login & refresh (don't leak which is wrong; don't leak email existence on register either — return 200 + tokens always, but actually for register we accept that 409 leaks; document the tradeoff)
- Refresh tokens **stored only as SHA-256 hash** — DB dump can't be replayed
- Signing key must be ≥ 32 bytes; document `openssl rand -base64 64` in README; never check the prod key into git; load via `SATURDAZE_JWT_SIGNING_KEY`
- `ClockSkew = Zero` so expiry is honored exactly
- `RequireHttpsMetadata = !env.IsDevelopment()`
- Access tokens ~15 min, refresh ~14 days (configurable)
- CORS already restricts origins via config — keep
- **Out of scope for v1, noted as follow-up**: lockout/throttling on repeated failed logins, email verification, password reset, MFA

## 9. Configuration (`appsettings.json`)

```json
"Saturdaze": {
  "Jwt": {
    "Issuer": "saturdaze",
    "Audience": "saturdaze-clients",
    "SigningKey": "REPLACE_VIA_SATURDAZE_JWT_SIGNING_KEY_ENV",
    "AccessTokenMinutes": 15,
    "RefreshTokenDays": 14
  }
}
```

Dev `appsettings.Development.json` ships with a placeholder key + a startup warning if the placeholder is detected in non-Development.

## 10. Family ↔ User wiring (decision needed)

Current `SingleFamilyAccessor` assumes one family in the DB. Two paths:
- **(a) Per-user family** (recommended): add `FamilyId` to `User`; on `/auth/register` create a Family and link; replace `SingleFamilyAccessor` with `CurrentUserFamilyAccessor` that reads `currentUser.FamilyId`.
- **(b) Defer**: keep `SingleFamilyAccessor` for now; assign all new users to the seeded family. Faster to ship, but only correct for a single-household deployment.

Recommendation: (a), since it unlocks multi-tenant later for free, but it touches existing handlers.

## 11. Tests

`Saturdaze.Application.Tests/Auth/`:
- `RegisterUserCommandHandlerTests` — happy path, duplicate email, weak password (validator)
- `LoginCommandHandlerTests` — happy path, wrong password, unknown email both surface `InvalidCredentialsException`
- `RefreshTokenCommandHandlerTests` — happy rotation, expired, revoked, **reuse detection revokes chain**
- Validator tests via FluentValidation TestExtensions

`Saturdaze.Infrastructure.Tests/`:
- `JwtTokenServiceTests` — token round-trips with `JwtSecurityTokenHandler.ValidateToken`, contains expected claims, expires correctly
- `Pbkdf2PasswordHasherTests` — round-trip + wrong password rejected

`Saturdaze.Api.Tests/`:
- `AuthControllerTests` — register → login → call `/api/family` with bearer (200); without bearer (401); refresh; logout invalidates
- `AuthorizationTests` — non-admin hitting `[Authorize(Roles="Admin")]` endpoint returns 403

## 12. Rollout order

1. Add packages + `Domain` entities + `UserRole`
2. EF configurations + extend `IAppDbContext`/`AppDbContext`
3. Create migration `AddAuth`; verify with `dotnet ef migrations script`
4. Application abstractions + DTOs + exceptions
5. Infrastructure implementations + DI registration
6. `AuthController` + `Program.cs` wiring + `HttpContextCurrentUserAccessor`
7. `[Authorize]` on existing controllers + 401 mapping in middleware
8. Tests (Application → Infrastructure → API integration)
9. README: how to generate signing key, register first user, optionally CLI command to promote a user to Admin

## Open questions before implementation

1. **Family-User linkage** — go with (a) per-user family, or (b) defer?
2. **Admin bootstrapping** — add `dotnet run --project src/Saturdaze.Cli -- promote <email>` so the first admin is created via CLI? Or seed a default admin?
3. **Refresh token transport** — keep in JSON response body (current plan, matches "client stores tokens"), or switch to HttpOnly secure cookie for refresh while access stays in body? Body is simpler but vulnerable to XSS exfiltration; cookie is safer but complicates CORS.
