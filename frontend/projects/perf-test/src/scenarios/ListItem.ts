import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Disc, List, ListItem } from 'components';

@Component({
  imports: [Disc, ListItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-list-item title="Swim lessons" subtitle="Saturdays · 9:00 to 10:00" chevron action>
      <sd-disc slot="leading" icon="lock" tone="accent" />
    </sd-list-item>
  `,
})
export default class ListItemScenario {}

@Component({
  imports: [List],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sd-list card><ng-content /></sd-list>`,
})
class ListDecorator {}

export { ListDecorator as decorator };
