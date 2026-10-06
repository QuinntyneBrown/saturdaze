import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Button, Card, type PartialTheme, ThemeProvider } from 'components';

/** The runtime cost of `[sdThemeProvider]` writing a partial theme onto a subtree. */
@Component({
  imports: [Button, Card, ThemeProvider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-card [sdThemeProvider]="roomier">
      <sd-button variant="primary">Plan my weekend</sd-button>
    </sd-card>
  `,
})
export default class ThemeProviderScenario {
  protected readonly roomier: PartialTheme = {
    borderRadiusCircular: '8px',
    borderRadiusLarge: '4px',
    fontWeightSemibold: '700',
  };
}
