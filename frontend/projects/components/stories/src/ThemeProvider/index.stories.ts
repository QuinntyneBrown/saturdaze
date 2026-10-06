import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, Card, Chip, ThemeProvider } from 'components';

import descriptionMd from './ThemeProviderDescription.md';
import bestPracticesMd from './ThemeProviderBestPractices.md';

export { Default } from './ThemeProviderDefault.stories';
export { Rebrand } from './ThemeProviderRebrand.stories';

export default {
  title: 'Components/ThemeProvider',
  component: ThemeProvider,
  decorators: [moduleMetadata({ imports: [ThemeProvider, Button, Card, Chip] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<ThemeProvider>;
