# Saturdaze marketing site

The static page served at **https://www.saturdaze.ca** (ADR-018). Plain HTML, one stylesheet and one script, with no framework and no build. The Angular app lives at https://app.saturdaze.ca; every call to action here links there.

| File                                            | What it is                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `index.html`                                    | The page (L2-150 to L2-153). No inline script or style: the Content-Security-Policy forbids them.    |
| `assets/tokens.css`                             | **Generated** by `npm run tokens` in `frontend/` from the TypeScript theme (ADR-013). Never edit it. |
| `assets/saturdaze.css`                          | The layout. It mirrors `docs/mocks/styles/marketing.css` rule for rule, using Fluent tokens by role. |
| `assets/saturdaze.js`                           | Menu, header shadow, reveal on scroll, footer year.                                                  |
| `assets/screenshots/`, `assets/social-card.png` | Captured from the real app by `tools/marketing-screenshots/capture.mjs`.                             |
| `assets/video/`                                 | `meet-saturdaze.mp4` from `docs/videos/44-meet-saturdaze`, and its poster.                           |
| `staticwebapp.config.json`                      | Security headers (L2-154) and a few redirects to the app.                                            |

## Preview locally

```sh
cd e2e && node fixtures/marketing-server.mjs ../marketing 4500
# http://localhost:4500, served with the production headers
```

## Test

```sh
cd e2e && npm run test:marketing
```

## Change it

Edit the mock first (`docs/mocks/pages/marketing.html`, `docs/mocks/styles/marketing.css`), then make the same change here, then re-capture the visual baseline (`npm run baseline -- --project=marketing` from `e2e/`). Run Prettier on this folder from `frontend/` (`npx prettier --write ../marketing`); the pre-commit hook does not see it. Deployment is the `marketing-web` job in `.github/workflows/deploy.yml`.
