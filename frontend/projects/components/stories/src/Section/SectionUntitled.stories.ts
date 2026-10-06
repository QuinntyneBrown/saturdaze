import type { StoryObj } from '@storybook/angular';

import type { Section } from 'components';

export const Untitled: StoryObj<Section> = {
  render: () => ({
    template: `
      <sd-section style="display: block; max-width: 480px">
        <sd-list card>
          <sd-list-item title="Port Credit, Mississauga" subtitle="Drive times are measured from here">
            <sd-disc slot="leading" icon="pin" />
          </sd-list-item>
        </sd-list>
      </sd-section>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Without a `title` no header renders — and neither does `[slot=action]` — leaving just the section spacing around the body.',
      },
    },
  },
};
