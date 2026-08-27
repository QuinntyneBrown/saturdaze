# Saturdaze Design System

The standalone, first-class reference for Saturdaze foundations, 29 native components, 18 dialog scenarios, and eight responsive product-pattern families. It has no runtime, validation, test, or build dependency on another repository folder and can be copied or versioned independently.

## Run locally

```sh
npm ci
npm start
```

Open `http://127.0.0.1:5174/`. Component, dialog, and pattern URLs support direct navigation and browser refresh.

## Validate and test

```sh
npm run validate
npm test
```

The Playwright suite exercises mobile, tablet, and desktop layouts. Install Chromium once with `npx playwright install chromium` if needed.

## Build and deploy

```sh
npm run build
```

Deploy `dist/` to Azure Static Web Apps. The build includes `staticwebapp.config.json`, `component-manifest.json`, the dedicated preview page, and the SPA navigation fallback.

## Ownership

- `assets/tokens.css` is authoritative for this product.
- `assets/components/` contains the complete native component implementation.
- `component-manifest.json` is the versioned public inventory, API metadata, examples, dialog scenarios, and pattern states.
- `assets/catalog-content.js` owns standalone dialog and pattern fixtures.
- Other products may duplicate these values, but do not import them at runtime.
