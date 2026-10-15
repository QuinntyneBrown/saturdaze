import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { ErrorSummary } from 'components';

import descriptionMd from './ErrorSummaryDescription.md';
import bestPracticesMd from './ErrorSummaryBestPractices.md';

export { Default } from './ErrorSummaryDefault.stories';
export { SingleProblem } from './ErrorSummarySingleProblem.stories';

export default {
  title: 'Components/ErrorSummary',
  component: ErrorSummary,
  decorators: [moduleMetadata({ imports: [ErrorSummary] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<ErrorSummary>;
