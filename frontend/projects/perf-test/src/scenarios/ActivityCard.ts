import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ActivityCard, Chip, Icon } from 'components';

@Component({
  imports: [ActivityCard, Chip, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-activity-card
      title="Bronte Creek Provincial Park"
      meta="Oakville"
      why="Short trail, washrooms, picnic tables. Your usual win, with a splash pad if it gets hot."
      icon="tree"
      tone="leaf"
    >
      <sd-chip slot="chips" tone="sky"
        ><sd-icon name="car" [size]="13" [stroke]="2" />25 min</sd-chip
      >
      <sd-chip slot="chips">Ages 5+</sd-chip>
    </sd-activity-card>
  `,
})
export default class ActivityCardScenario {}
