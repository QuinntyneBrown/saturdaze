import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DateTile } from 'components';

@Component({
  imports: [DateTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <sd-date-tile mon="May" day="17" /> `,
})
export default class DateTileScenario {}
