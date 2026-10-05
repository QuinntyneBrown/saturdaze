import type { StoryObj } from '@storybook/angular';

import type { Section } from 'components';

export const Default: StoryObj<Section & { title: string }> = {
  args: {
    title: 'Who\'s in',
    subtitle: 'Ages shape the picks. Tap a person to edit.',
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-section style="display: block; max-width: 480px" [title]="title" [subtitle]="subtitle">
        <sd-list card>
          <sd-list-item title="Quinn" subtitle="Parent · 38" chevron>
            <sd-avatar slot="leading" name="Quinn" tone="primary" size="lg" />
          </sd-list-item>
          <sd-list-item title="Sara" subtitle="Parent · 36" chevron>
            <sd-avatar slot="leading" name="Sara" tone="leaf" size="lg" />
          </sd-list-item>
          <sd-list-item title="Eli" subtitle="Kid · 9" chevron>
            <sd-avatar slot="leading" name="Eli" tone="sky" size="lg" />
          </sd-list-item>
          <sd-list-item title="Mae" subtitle="Kid · 5" chevron>
            <sd-avatar slot="leading" name="Mae" tone="sun" size="lg" />
          </sd-list-item>
        </sd-list>
      </sd-section>
    `,
  }),
};
