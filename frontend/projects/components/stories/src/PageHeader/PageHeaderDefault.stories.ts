import type { StoryObj } from '@storybook/angular';

import type { PageHeader } from 'components';

export const Default: StoryObj<PageHeader> = {
  args: {
    pageTitle: 'This weekend',
    subtitle: 'Sunny Saturday for the lavender, a cloudy Sunday for the Rec Room.',
    backHref: '',
    backLabel: 'Back',
  },
  render: (args) => ({
    props: args,
    template: `<sd-page-header [title]="pageTitle" [subtitle]="subtitle" [backHref]="backHref" [backLabel]="backLabel" />`,
  }),
};
