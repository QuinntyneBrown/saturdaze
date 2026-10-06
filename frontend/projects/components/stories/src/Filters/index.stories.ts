import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { FilterChip, Filters } from 'components';

import descriptionMd from './FiltersDescription.md';
import bestPracticesMd from './FiltersBestPractices.md';

export { Default } from './FiltersDefault.stories';
export { Scroll } from './FiltersScroll.stories';
export { Wrap } from './FiltersWrap.stories';
export { WithDivider } from './FiltersWithDivider.stories';

export default {
  title: 'Components/Filters',
  component: Filters,
  decorators: [moduleMetadata({ imports: [Filters, FilterChip] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Filters>;
