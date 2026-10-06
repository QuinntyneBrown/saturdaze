import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EventCard, Chip } from 'components';

@Component({
  imports: [EventCard, Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-event-card
      title="Port Credit farmers' market"
      meta="Port Credit · 8am to 1pm"
      mon="May"
      day="17"
    >
      <sd-chip slot="chips" tone="leaf">Outdoor</sd-chip>
    </sd-event-card>
  `,
})
export default class EventCardScenario {}
