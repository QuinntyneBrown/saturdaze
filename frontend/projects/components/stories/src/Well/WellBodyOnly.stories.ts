import type { StoryObj } from '@storybook/angular';

import type { Well } from 'components';

export const BodyOnly: StoryObj<Well> = {
  render: () => ({
    template: `
      <div style="max-width: 420px">
        <sd-well icon="car">About 25 minutes from home. Free parking on Elm Street after 10.</sd-well>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Without `title` the well is a single soft line of body text beside the glyph.' } },
  },
};
