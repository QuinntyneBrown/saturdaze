# 12 · Saturdaze Admin: a second app, one sign-in

This branch adds Saturdaze Admin, a second web application in the Saturdaze workspace. It exists so a curator can look after the photos families see on idea cards, past weekends and weekend covers. This is the first of six videos about it. This one covers the shell: why admin is a separate app, what it shares with the family app, who gets in, how the layout adapts, and how it ships. The next five walk through the features screen by screen. Everything you see on screen is the real app, running locally against a demo database, as of October 2026.

## Why a second application

The family app is meant to stay radically simple: five screens, one primary action each. Photo administration needs seven screens and six dialogs, a desktop-first layout with a side navigation, and a different audience: a curator working a few hours a week on a laptop. Putting all of that inside the family app would grow the family bundle, mix two shells in one route table, and ship admin code to every family.

So ADR-014 makes admin a second Angular application, `frontend/projects/admin`. It is generated with the same `sd` prefix, standalone components, builder, budgets, lint and format rules as the family app. It runs on its own port with `npm run start:admin`, and it deploys to its own host.

## What the two apps share

The rule is shared libraries, no copied code. Admin imports the `components` and `api` libraries through the workspace path mappings. The new pieces it needed, the admin navigation, the admin gate, the stat card, the photo tile and the slot preview, were built in `components`, each with a Storybook story folder, so either app can use them.

Now open the admin composition root, `app.config.ts`. Pages never inject a concrete service. They depend on three tokens, `ADMIN_PLACES_SERVICE`, `ADMIN_PHOTOS_SERVICE` and `ADMIN_AUDIT_SERVICE`, and this file binds each one to its HTTP implementation from the `api` library. It is the same contract-and-token pattern the family app uses, so a test or a story can bind a fake instead.

The auth plumbing moved as well. The interceptor and the `requireAuth`, `requireAnonymous` and `requireAdmin` guards left the family app for the `api` library. The only thing that differs between the two apps is where the guards send people, so that became a token, `AUTH_ROUTES`. The family app keeps the defaults. Admin binds sign in to its own sign-in screen and home to the root, which is its Photo health screen. The family app's behaviour, and its end-to-end specs, did not change.

## Who gets in

There is one identity and one API. An administrator signs in with their ordinary Saturdaze account. There is no separate admin user store.

Watch an anonymous visitor ask for the Places screen. The `requireAuth` guard sends them to the admin sign-in, and remembers the screen they asked for. They sign in as the seeded administrator and land straight on Places, not on the home screen. That return trip matters for curators who follow a link from a chat message or a ticket.

Now a family account. The seeded family account signs in successfully, because the password is right, but its role is User, not Admin. Instead of an admin screen, the shell renders the admin gate: this account can't use Saturdaze Admin. It says plainly that nothing from the catalog was loaded, and the only actions are sign out, or a link back to the family app. Sign out revokes the session and returns to the sign-in screen.

Notice that the gate is not a route guard. The address stays where it is, and the shell swaps the router outlet for the gate. So no admin page is ever constructed, and no request goes to the admin API. In `app.html` you can see it: while the session loads, a blank frame; then the bare sign-in frame; then, for a signed-in user who is not an administrator, `sd-admin-gate` where the outlet would be.

That client-side gate is a courtesy, not security. The boundary is on the server. Every endpoint under the admin route lives on `AdminPhotosController`, which carries `Authorize` with the Admin policy, on top of the global authenticated fallback from ADR-008. The policy requires the Admin role. So a family token gets a 403 from every admin endpoint, and no token at all gets a 401, whatever the browser does.

## The layout

Once in, an administrator gets a side navigation with five destinations: Photo health, which is home, then Places, Review queue, Ingestion skips and Activity log. The current destination carries `aria-current` set to page, and the signed-in account and the sign out button sit at the bottom.

The shell is desktop-first, because curators work on laptops, but it is not desktop-only. Below ten twenty-four pixels, the side navigation turns into a top bar with the same destinations, which scrolls sideways, and every screen stays usable down to a three ninety pixel phone with no horizontal scroll. Admin loads the same foundation stylesheet and generated design tokens as the family app, so it looks like Saturdaze. The family app's bottom navigation and its iOS chrome handling simply do not apply here.

## Shipping it

`frontend/package.json` gains `start:admin` and `build:admin`. In continuous integration, lint, the format check and the unit tests already cover the whole workspace, so the only new step is a production build of admin, next to the family app's build.

The deploy workflow builds the admin bundle and uploads it as an artifact. A new `admin-web` job then deploys `dist/admin/browser` to its own Azure Static Web App. It runs after the migration job, like the family app, and it uses its own deployment token, `SWA_ADMIN_DEPLOYMENT_TOKEN`. Until that secret exists, the job does not fail the deploy. It writes a step summary saying the admin deploy was skipped, and what to set up first.

Two API settings matter. The admin origin must be listed in `Cors:AllowedOrigins`, or the browser blocks every call the admin app makes. And because curated photos are served by the API itself, the API origin belongs in the image allow-list and in both apps' content security policy. Video fifteen covers that store in detail.

## Recap

Things to remember.

- Saturdaze Admin is a second Angular app on its own host, so admin code never reaches the family bundle.
- It shares the `components` and `api` libraries, binds its services to tokens, and copies no code.
- One account and one API: the gate in the browser is a courtesy, and the Admin policy on the server is the boundary.
- The layout is desktop-first, with a side navigation from ten twenty-four pixels and a top bar below.
- The admin deploy job runs after migrations with its own token, and says clearly when it was skipped.

Next, in video thirteen: the admin home screen, measuring photo health per catalog, and finding the places that need you.
