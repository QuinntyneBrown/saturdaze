import type { StoryObj } from '@storybook/angular';

import type { SkipLink } from 'components';

export const Default: StoryObj<SkipLink> = {
  args: {
    target: 'story-main',
    label: 'Skip to content',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="position: relative; min-height: 160px">
        <sd-skip-link [target]="target" [label]="label" />
        <nav style="display: flex; gap: 16px; padding: 16px"><a href="#">Weekend</a><a href="#">Ideas</a></nav>
        <main id="story-main" style="padding: 16px">Click into this frame and press Tab: the link appears; Enter moves focus here.</main>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'At rest the link sits off screen. Press Tab inside the story and it appears at the top left; Enter moves focus to the target.',
      },
    },
  },
};
