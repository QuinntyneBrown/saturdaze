import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Stars } from 'components';

@Component({
  imports: [Stars],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <sd-stars [rating]="4" label="4 of 5" /> `,
})
export default class StarsScenario {}
