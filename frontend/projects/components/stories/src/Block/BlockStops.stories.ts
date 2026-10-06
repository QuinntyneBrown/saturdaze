import type { StoryObj } from '@storybook/angular';

import type { Block } from 'components';

export const Stops: StoryObj<Block> = {
  render: () => ({
    template: `
      <div role="list" style="max-width: 560px">
        <sd-block time="9:00" duration="60m" icon="lock" title="Swim lessons" subtitle="Port Credit pool" commitment />
        <sd-leg label="45 min · 40 km" ariaLabel="Travel: 45 minutes, 40 kilometres to Lavender fields" directionsUrl="https://www.google.com/maps/dir/?api=1&origin=43.5547,-79.5816&destination=43.5386,-79.9611&travelmode=driving" />
        <sd-block time="11:00" duration="2h" title="Lavender fields" subtitle="Terre Bleu, Milton" [stopNumber]="1" active />
        <sd-leg label="5 min · 2 km home" ariaLabel="Travel: 5 minutes, 2 kilometres home" />
        <sd-block time="15:00" duration="2h" icon="bed" title="Quiet time at home" />
      </div>
    `,
  }),
};
