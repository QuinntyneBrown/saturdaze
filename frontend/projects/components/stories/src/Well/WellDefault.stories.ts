import type { StoryObj } from '@storybook/angular';

import type { Well } from 'components';

export const Default: StoryObj<Well & { title: string }> = {
  args: {
    icon: 'sparkle',
    tone: 'default',
    title: 'Why this',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 420px">
        <sd-well [icon]="icon" [tone]="tone" [title]="title">Sunny and 22° on Saturday afternoon, so we kept the picnic at Riverside Park outside.</sd-well>
      </div>
    `,
  }),
};
