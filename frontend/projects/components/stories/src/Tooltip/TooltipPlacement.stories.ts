import type { StoryObj } from '@storybook/angular';

import type { Tooltip } from 'components';

export const Placement: StoryObj<Tooltip> = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 24px; padding: 48px 0">
        <button type="button" class="btn btn--quiet" sdTooltip="Above (default)">Top</button>
        <button type="button" class="btn btn--quiet" sdTooltip="Below" sdTooltipPlacement="bottom">Bottom</button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The `sdTooltip` directive works on any focusable element. `sdTooltipPlacement` picks the preferred side; it flips when there is no room.',
      },
    },
  },
};
