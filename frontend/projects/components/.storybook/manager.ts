import { addons } from 'storybook/manager-api';

import saturdazeTheme from './theme';

addons.setConfig({
  theme: saturdazeTheme,
  // Docs-first like the Fluent docsite: the addon panel opens on demand.
  showPanel: false,
  sidebar: {
    showRoots: true,
  },
});
