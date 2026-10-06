import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Toggle } from 'components';

@Component({
  imports: [Toggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <sd-toggle label="Remember me" checked /> `,
})
export default class ToggleScenario {}
