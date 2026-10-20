import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { PhotoSuggestions } from 'components';

import descriptionMd from './PhotoSuggestionsDescription.md';
import bestPracticesMd from './PhotoSuggestionsBestPractices.md';

export { Default } from './PhotoSuggestionsDefault.stories';
export { Loading } from './PhotoSuggestionsLoading.stories';
export { Empty } from './PhotoSuggestionsEmpty.stories';
export { Failed } from './PhotoSuggestionsFailed.stories';

export default {
  title: 'Components/Photo Suggestions',
  component: PhotoSuggestions,
  decorators: [moduleMetadata({ imports: [PhotoSuggestions] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<PhotoSuggestions>;
