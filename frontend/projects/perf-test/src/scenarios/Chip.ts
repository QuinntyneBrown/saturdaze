import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Chip } from 'components';

@Component({
  imports: [Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <sd-chip tone="leaf">Outdoor</sd-chip> `,
})
export default class ChipScenario {}
