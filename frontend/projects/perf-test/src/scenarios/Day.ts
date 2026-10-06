import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Block, Chip, Day, GhostRow, Icon } from 'components';

/** A whole planned day: the densest composition on the Weekend screen. */
@Component({
  imports: [Block, Chip, Day, GhostRow, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-day
      title="Saturday"
      meta="17 May · 22° / 14° · Light breeze, good for outdoors"
      weather="sun"
    >
      <sd-block
        time="8:30"
        duration="30m"
        icon="home"
        title="Breakfast at home"
        subtitle="Cereal day, Eli's choice"
      />
      <sd-block
        commitment
        time="9:00"
        duration="60m"
        icon="bike"
        title="Swim lessons"
        subtitle="Every Saturday · locked in"
      >
        <sd-chip slot="chips" tone="accent"
          ><sd-icon name="lock" [size]="13" [stroke]="2" />Commitment</sd-chip
        >
      </sd-block>
      <sd-block drive time="10:30" duration="45m" icon="car" title="Drive to Terre Bleu" />
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
      <sd-block
        time="13:00"
        duration="75m"
        icon="fork"
        title="Lunch at La Marina"
        subtitle="3 of 4 votes"
      />
      <sd-ghost-row slot="footer" icon="bag">Add an errand</sd-ghost-row>
    </sd-day>
  `,
})
export default class DayScenario {}
