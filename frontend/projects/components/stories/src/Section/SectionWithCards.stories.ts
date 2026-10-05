import type { StoryObj } from '@storybook/angular';

import type { Section } from 'components';

export const WithCards: StoryObj<Section> = {
  render: () => ({
    template: `
      <sd-section title="Right for this weekend's weather" subtitle="Sunny Saturday, 22°">
        <div class="sd-grid-cards">
          <sd-activity-card
            title="Terre Bleu Lavender Farm"
            meta="Milton"
            why="Lavender peaks 17 to 24 May, and Mae is old enough to walk the rows this year."
          />
          <sd-activity-card
            title="Bronte Creek Provincial Park"
            meta="Oakville"
            why="Short trail, washrooms, picnic tables. Your usual win, with a splash pad if it gets hot."
          />
        </div>
      </sd-section>
    `,
  }),
  parameters: {
    docs: { description: { story: 'The Ideas screens group card grids under sections with a short weather or time subtitle.' } },
  },
};
