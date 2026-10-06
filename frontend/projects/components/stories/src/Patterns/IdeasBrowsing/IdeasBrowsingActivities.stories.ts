import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import { appShell } from '../shared/shell';
import { IDEAS_STYLES, IDEAS_TABS, ideasHeader } from './ideas';

const FILTERS = [
  { label: 'All', tone: 'default' },
  { label: 'Outdoor', tone: 'leaf' },
  { label: 'Indoor', tone: 'indoor' },
  { label: 'Under 30 min', tone: 'default' },
  { label: 'Ages 5+', tone: 'default' },
  { label: 'Weather-safe', tone: 'sky' },
];

export const Activities: StoryObj = {
  render: () => {
    const active = signal('All');
    return {
      props: {
        tabs: IDEAS_TABS,
        filters: FILTERS,
        active,
        pick: (label: string) => active.set(label),
      },
      styles: IDEAS_STYLES,
      template: appShell(
        'ideas',
        `
          ${ideasHeader('Picked for Eli and Mae, under 45 minutes from Port Credit.', 'Activities')}
          <sd-filters class="filters" label="Filters">
            @for (chip of filters; track chip.label) {
              <sd-filter-chip [tone]="chip.tone" [pressed]="active() === chip.label" (pressedChange)="pick(chip.label)">{{ chip.label }}</sd-filter-chip>
            }
          </sd-filters>

          <sd-section class="section" title="Right for this weekend's weather" subtitle="Sunny Saturday, 22°">
            <div class="sd-grid-cards">
              <sd-activity-card title="Terre Bleu Lavender Farm" meta="Milton" icon="tree" tone="leaf"
                why="Lavender peaks 17 to 24 May, and Mae is old enough to walk the rows this year." mapUrl="https://maps.example.com/terre-bleu">
                <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />45 min</sd-chip>
                <sd-chip slot="chips">All ages</sd-chip>
              </sd-activity-card>
              <sd-activity-card title="Bronte Creek Provincial Park" meta="Oakville" icon="tree" tone="leaf"
                why="Short trail, washrooms, picnic tables. Your usual win, with a splash pad if it gets hot." mapUrl="https://maps.example.com/bronte-creek">
                <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />25 min</sd-chip>
                <sd-chip slot="chips">Ages 5+</sd-chip>
              </sd-activity-card>
              <sd-activity-card title="Royal Botanical Gardens" meta="Burlington" icon="tree" tone="leaf"
                why="Tulip festival in bloom. Paved paths, so the wagon works." mapUrl="https://maps.example.com/rbg">
                <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />35 min</sd-chip>
              </sd-activity-card>
            </div>
          </sd-section>

          <sd-section class="section" title="If the weather turns" subtitle="Cloudy Sunday afternoon">
            <div class="sd-grid-cards">
              <sd-activity-card title="The Rec Room" meta="Square One" icon="popcorn" tone="indoor"
                why="Bowling, arcade and dinner under one roof. Eli asked for it twice last week." mapUrl="https://maps.example.com/rec-room">
                <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />10 min</sd-chip>
                <sd-chip slot="chips">All ages</sd-chip>
              </sd-activity-card>
              <sd-activity-card title="Ontario Science Centre" meta="Toronto" icon="ticket" tone="indoor"
                why="The new Senses exhibit. Quiet room on level two when Mae has had enough." mapUrl="https://maps.example.com/osc">
                <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />30 min</sd-chip>
                <sd-chip slot="chips">Ages 4+</sd-chip>
              </sd-activity-card>
            </div>
          </sd-section>
        `,
      ),
    };
  },
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      description: {
        story:
          'Activities grouped by why they fit this weekend. The filter chips are single-select here (`aria-pressed`); click one to move the selection.',
      },
    },
  },
};
