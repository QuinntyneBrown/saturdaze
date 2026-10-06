import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Card, Chip, Icon } from 'components';

@Component({
  imports: [Card, Chip, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-card>
      <strong>Saturday at the farmers' market</strong>
      <span class="sd-text-sm sd-text-soft">Port Credit · 8am to 1pm</span>
      <div class="sd-cluster">
        <sd-chip tone="leaf">Outdoor</sd-chip>
        <sd-chip tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />5 min</sd-chip>
      </div>
    </sd-card>
  `,
})
export default class CardScenario {}
