import type { StoryObj } from '@storybook/angular';

import type { Well } from 'components';

export const Default: StoryObj<Well> = {
  args: {
    icon: 'sparkle',
    tone: 'default',
    wellTitle: 'Why this',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 420px">
        <sd-well [icon]="icon" [tone]="tone" [title]="wellTitle">Sunny and 22° on Saturday afternoon, so we kept the picnic at Riverside Park outside.</sd-well>
      </div>
    `,
  }),
};
