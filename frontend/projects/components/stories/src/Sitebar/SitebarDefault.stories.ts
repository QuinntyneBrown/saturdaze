import type { StoryObj } from '@storybook/angular';

import type { Sitebar } from 'components';

export const Default: StoryObj<Sitebar> = {
  args: {
    cta: false,
    homeHref: '/',
  },
  argTypes: {
    homeHref: {
      control: 'text',
      description:
        "Where the wordmark leads. The family app passes its marketing site URL (https://www.saturdaze.ca/, ADR-018); '/' by default.",
    },
  },
  render: (args) => ({
    props: args,
    template: `<sd-sitebar [cta]="cta" [homeHref]="homeHref" />`,
  }),
};
