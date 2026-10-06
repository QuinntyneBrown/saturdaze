import type { StoryObj } from '@storybook/angular';

import type { Block } from 'components';

export const ReadOnly: StoryObj<Block> = {
  render: () => ({
    template: `
      <div role="list" style="max-width: 560px">
        <sd-block readonly time="14:30" duration="2h" icon="popcorn" title="The Rec Room" subtitle="Bowling and arcade · Eli's pick">
          <sd-chip slot="chips" tone="primary">Day highlight</sd-chip>
        </sd-block>
        <sd-block readonly time="17:00" duration="90m" icon="home" title="Quiet evening" subtitle="Sunday dinner stays open on purpose" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: '`readonly` hides the phone chevron. The shared weekend uses it and projects no actions.' },
    },
  },
};
