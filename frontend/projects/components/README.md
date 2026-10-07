# @saturdaze/components

The Saturdaze design system: standalone Angular components (`sd-*`) built on
[Fluent UI v9](https://react.fluentui.dev/)–style design tokens. It is the
component library behind [Saturdaze](https://github.com/QuinntyneBrown/saturdaze),
a family weekend planner.

## Install

```bash
npm install @saturdaze/components @angular/cdk
```

Peer dependencies: `@angular/core`, `@angular/common`, `@angular/forms`,
`@angular/router`, `@angular/platform-browser` and `@angular/cdk`, all `^21.2.0`.

## Styles

The components read design tokens as CSS custom properties. Load the
foundations (tokens, breakpoints and base page styles) once in your global
stylesheet, together with the CDK overlay styles that dialogs, menus and
tooltips use:

```scss
// styles.scss
@use '@saturdaze/components/styles';
@import '@angular/cdk/overlay-prebuilt.css';
```

Dialogs open through the CDK `Dialog` with
`{ panelClass: 'sd-dialog-panel', backdropClass: 'sd-dialog-backdrop' }`. Style
those two classes in your app to place the panel (the Saturdaze app makes it a
bottom sheet below 720px and a centred modal above).

## Usage

Every component is standalone. Import the ones you use:

```ts
import { Component } from '@angular/core';
import { Button, Card } from '@saturdaze/components';

@Component({
  selector: 'app-example',
  imports: [Button, Card],
  template: `
    <sd-card>
      <sd-button>Plan the weekend</sd-button>
    </sd-card>
  `,
})
export class Example {}
```

Selectors keep the `sd-` prefix and the exported classes drop it
(`sd-button` → `Button`).

### Theming

The global stylesheet applies the Saturdaze light theme. To re-theme one part
of a page, put `ThemeProvider` on an element and pass a partial theme:

```html
<section [sdThemeProvider]="{ colorBrandBackground: '#2d7d5f' }">…</section>
```

The `tokens` export gives typed `var(--token)` references for use in your own
component styles and code.

## Documentation

The Storybook docsite documents every component, with live examples, API
tables and best practices. Run `npm run storybook` from `frontend/` in the
[repository](https://github.com/QuinntyneBrown/saturdaze).

## Releases

Every push to `main` that changes the library publishes a new version. The
conventional-commit messages since the last release set the bump: a `feat:`
commit gives a minor release, `!` after the type or a `BREAKING CHANGE:`
footer gives a major one, and anything else gives a patch. Releases are tagged
`components-v<version>` (see ADR-016 in the repository).

## License

MIT
