import type { StoryObj } from '@storybook/angular';

import type { Segments } from 'components';

export const Tabs: StoryObj<Segments> = {
  render: () => ({
    props: {
      tabs: [
        { label: 'Saturday', panel: 'saturday-panel' },
        { label: 'Sunday', panel: 'sunday-panel' },
      ],
      selected: 'Saturday',
    },
    template: `
      <sd-segments mode="tabs" narrow label="Day" [tabs]="tabs" [(selected)]="selected" />
      <p id="saturday-panel" role="tabpanel" [hidden]="selected !== 'Saturday'" style="margin-top: 12px">Saturday's timeline and map.</p>
      <p id="sunday-panel" role="tabpanel" [hidden]="selected !== 'Sunday'" style="margin-top: 12px">Sunday's timeline and map.</p>
    `,
  }),
};
