import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Block, Chip, Icon } from 'components';

@Component({
  imports: [Block, Chip, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-block
      time="11:00"
      duration="2h"
      icon="tree"
      title="Lavender fields"
      subtitle="Terre Bleu, Milton · walk the rows"
    >
      <sd-chip slot="chips" tone="primary">Day highlight</sd-chip>
      <sd-chip slot="chips" tone="sky"
        ><sd-icon name="car" [size]="13" [stroke]="2" />45 min drive</sd-chip
      >
    </sd-block>
  `,
})
export default class BlockScenario {}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div role="list"><ng-content /></div>`,
})
class ListRoleDecorator {}

export { ListRoleDecorator as decorator };
