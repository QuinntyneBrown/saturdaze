import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Avatar, Card, Disc, GhostRow, List, ListItem } from 'components';

import descriptionMd from './ListDescription.md';
import bestPracticesMd from './ListBestPractices.md';

export { Default } from './ListDefault.stories';
export { Plain } from './ListPlain.stories';
export { WithGhostRow } from './ListWithGhostRow.stories';

export default {
  title: 'Components/List',
  component: List,
  decorators: [moduleMetadata({ imports: [List, ListItem, Avatar, Card, Disc, GhostRow] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<List>;
