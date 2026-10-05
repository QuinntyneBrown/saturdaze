import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Avatar, Button, Chip, Disc, Icon, List, ListItem } from 'components';

import descriptionMd from './ListItemDescription.md';
import bestPracticesMd from './ListItemBestPractices.md';

export { Default } from './ListItemDefault.stories';
export { Action } from './ListItemAction.stories';
export { AsLink } from './ListItemAsLink.stories';
export { SubtitleFirst } from './ListItemSubtitleFirst.stories';
export { Trailing } from './ListItemTrailing.stories';

export default {
  title: 'Components/List Item',
  component: ListItem,
  decorators: [moduleMetadata({ imports: [ListItem, List, Avatar, Button, Chip, Disc, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<ListItem>;
