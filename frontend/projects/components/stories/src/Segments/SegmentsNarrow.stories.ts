import type { StoryObj } from '@storybook/angular';

import type { Segments } from 'components';

export const Narrow: StoryObj<Segments> = {
  render: () => ({
    props: {
      tabs: [
        { label: 'Terms', link: '/legal', fragment: 'terms' },
        { label: 'Privacy', link: '/legal', fragment: 'privacy' },
      ],
    },
    template: `
      <div style="max-width: 640px">
        <sd-segments narrow label="Document" [tabs]="tabs" active="Privacy" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`narrow` (`.segments--narrow`) sizes the track for a reading column. The Legal switch links to fragments, so it names the selected tab with `active` instead of relying on the router.',
      },
    },
  },
};
