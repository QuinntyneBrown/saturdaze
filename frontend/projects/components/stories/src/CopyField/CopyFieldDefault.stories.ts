import type { StoryObj } from '@storybook/angular';

import type { CopyField } from 'components';

export const Default: StoryObj<CopyField> = {
  args: {
    value: 'https://saturdaze.app/sample-weekend?share=7f3c9a2e',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 440px">
        <sd-copy-field [value]="value" />
      </div>
    `,
  }),
};
