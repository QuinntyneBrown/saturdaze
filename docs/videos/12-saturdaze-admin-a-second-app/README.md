# 12 · Saturdaze Admin: a second app, one sign-in

> **Runtime:** ~7.6 min · **Audience:** developers working on Saturdaze Admin or the shared libraries · **Prerequisites:** none; the family app's auth (ADR-007, ADR-008) helps

**Video:** [12-saturdaze-admin-a-second-app.mp4](12-saturdaze-admin-a-second-app.mp4) · [Slides](slides.html) · **Audio:** [12-saturdaze-admin-a-second-app.mp3](12-saturdaze-admin-a-second-app.mp3) · [Transcript](script.md) · [Clips](clips/clips.mjs)

## Why this video exists

The `claude/wonderful-babbage-usjue6` branch adds Saturdaze Admin (L1-036, L2-111…L2-123). This first video of the six-part series explains the shell before the features: why admin is a separate Angular application (ADR-014), what it shares with the family app, how sign-in and the admin gate work, how the layout adapts, and how the app is built and deployed. The screen recordings are the real app against the admin demo data.

## Learning objectives

By the end, the viewer can:

- Explain why admin ships as a second app on its own host rather than as routes in the family app.
- Name what moved into the `api` and `components` libraries, and how `AUTH_ROUTES` parameterises the shared guards.
- Describe the three sign-in outcomes: deep link and return, the gate for non-admins, sign-out.
- Explain why the gate is a courtesy and the `Admin` policy is the security boundary.
- List the CI and deploy changes, and the two API settings the admin host needs.

## Key questions

| Question | What a strong answer includes |
|----------|-------------------------------|
| Why a second app? | Family app stays five screens; admin needs seven screens, six dialogs, desktop-first side nav, a different audience; keeps admin code out of the family bundle (ADR-014). |
| What is shared? | `components` (new `sd-admin-nav`, `sd-admin-gate`, `sd-stat-card`, `sd-photo-tile`, `sd-slot-preview`, with stories) and `api` (admin services, auth guards and interceptor); pages inject `ADMIN_*_SERVICE` tokens. |
| How does a non-admin experience it? | Signs in, sees "This account can't use Saturdaze Admin", nothing loaded, Sign out or Open Saturdaze; the URL stays, the outlet is swapped. |
| Where is security enforced? | `[Authorize(Policy = "Admin")]` on `AdminPhotosController` on top of the authenticated fallback: 403 for a family token, 401 for none. |
| How does it ship? | `start:admin`, `build:admin`; CI builds admin; `deploy.yml` `admin-web` job after `migrate` with `SWA_ADMIN_DEPLOYMENT_TOKEN`, skipped with a summary until the token exists; `Cors:AllowedOrigins` lists the admin origin. |

## Code / assets on screen

| File | What to show |
|------|--------------|
| `docs/adr/ADR-014-separate-admin-application.md` | The decision |
| `frontend/projects/admin/src/app/app.config.ts` | Token bindings, `AUTH_ROUTES` |
| `frontend/projects/api/src/lib/auth/auth-routes.ts` | `AuthRoutes`, defaults |
| `frontend/projects/admin/src/app/app.html` | Loading, bare, gated, admin branches |
| `backend/src/Saturdaze.Api/Controllers/AdminPhotosController.cs`, `Program.cs` | `Admin` policy and fallback |
| `frontend/package.json`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml` | Scripts, admin build, `admin-web` job |
| `clips/deep-link.mp4`, `gate.mp4`, `tour.mp4`, `narrow.mp4` | Screen recordings |

## Run sheet

| Time | Segment | Content |
|------|---------|---------|
| 00:00-00:35 | Introduction | What Saturdaze Admin is; the six-video series |
| 00:36-01:26 | Why a second app | Two audiences, two shells; ADR-014 |
| 01:27-02:48 | Shared code | Libraries, tokens in `app.config.ts`, `AUTH_ROUTES` |
| 02:48-04:40 | Who gets in | Deep link + sign-in, the gate, `app.html`, the `Admin` policy |
| 04:41-05:34 | Layout | Side navigation tour; top bar at phone width |
| 05:34-06:47 | Shipping | Scripts and CI, the `admin-web` deploy job, CORS and image settings |
| 06:48-07:36 | Recap | Things to remember; next video |

## Demo commands

```powershell
cd frontend; npm run start:admin                      # http://localhost:4300
# Recordings: see tools/video-record/admin-demo/README.md
node tools/video-record/record-clips.mjs docs/videos/12-saturdaze-admin-a-second-app
```

## Pitfalls

- Treating the client gate as security: only the `Admin` policy on the API is.
- Forgetting `Cors:AllowedOrigins` for the admin host: every admin call fails in the browser.
- Expecting the admin deploy to fail loudly without its token: it is skipped with a warning and a step summary.

## References

- [ADR-014](../../adr/ADR-014-separate-admin-application.md), [ADR-008](../../adr/ADR-008-per-user-family-scoping-and-auth-fallback.md)
- `docs/specs/L2.md` (L2-111, L2-123); `docs/detailed-designs/administration/scaffold-admin-application/README.md`
- [Azure Static Web Apps deploy action](https://github.com/Azure/static-web-apps-deploy)
