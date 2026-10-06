import type { StoryObj } from '@storybook/angular';

import { appShell } from '../shared/shell';

export const Tablet: StoryObj = {
  render: () => ({
    template: appShell(
      'family',
      `
        <sd-page-header title="The Browns" subtitle="Port Credit, Mississauga. Every weekend is planned around this." />
        <sd-section title="Who's in" subtitle="Ages shape the picks. Tap a person to edit.">
          <sd-list card>
            <sd-list-item action chevron title="Quinn" subtitle="Parent · 38"><sd-avatar slot="leading" name="Quinn" tone="primary" /></sd-list-item>
            <sd-list-item action chevron title="Sara" subtitle="Parent · 36"><sd-avatar slot="leading" name="Sara" tone="sun" /></sd-list-item>
            <sd-list-item action chevron title="Eli" subtitle="Kid · 9"><sd-avatar slot="leading" name="Eli" tone="sky" /></sd-list-item>
            <sd-list-item action chevron title="Mae" subtitle="Kid · 5"><sd-avatar slot="leading" name="Mae" tone="leaf" /></sd-list-item>
          </sd-list>
        </sd-section>
      `,
    ),
  }),
  globals: { viewport: { value: 'tablet' } },
  parameters: {
    docs: {
      description: {
        story:
          'At 820px the top bar has already taken over (the switch is at 720px) while the content stays single-column.',
      },
    },
  },
};
