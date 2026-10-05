import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { FilterChip, Icon } from 'components';

import descriptionMd from './FilterChipDescription.md';
import bestPracticesMd from './FilterChipBestPractices.md';

export { Default } from './FilterChipDefault.stories';
export { Tone } from './FilterChipTone.stories';
export { WithIcon } from './FilterChipWithIcon.stories';
export { SingleSelect } from './FilterChipSingleSelect.stories';
export { MultiSelect } from './FilterChipMultiSelect.stories';
export { Disabled } from './FilterChipDisabled.stories';

export default {
  title: 'Components/Filter Chip',
  component: FilterChip,
  decorators: [moduleMetadata({ imports: [FilterChip, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<FilterChip>;
