import type { StoryObj } from '@storybook/angular';

import type { Leg } from 'components';

export const Default: StoryObj<Leg> = {
  args: {
    label: '45 min · 40 km',
    ariaLabel: 'Travel: 45 minutes, 40 kilometres to Lavender fields',
    directionsUrl:
      'https://www.google.com/maps/dir/?api=1&origin=43.5547,-79.5816&destination=43.5386,-79.9611&travelmode=driving',
  },
  render: (args) => ({
    props: args,
    template: `<div role="list" style="max-width: 560px"><sd-leg [label]="label" [ariaLabel]="ariaLabel" [directionsUrl]="directionsUrl" /></div>`,
  }),
};
