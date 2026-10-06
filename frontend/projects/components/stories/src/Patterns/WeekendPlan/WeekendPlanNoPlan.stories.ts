import type { StoryObj } from '@storybook/angular';

import { appShell } from '../shared/shell';

export const NoPlan: StoryObj = {
  name: 'No plan yet',
  render: () => ({
    template: appShell(
      'weekend',
      `
        <sd-page-header title="Your first weekend" subtitle="Nothing is drafted yet. Planning takes a few seconds." />
        <div class="sd-narrow">
          <sd-empty
            warm
            icon="sparkle"
            tone="primary"
            title="Saturday and Sunday, drafted around the Browns"
            body="Swim, church and the workout stay put. Everything else gets planned around the weather and what the kids like."
            note="Or wait for Friday at 6pm."
          >
            <sd-button slot="cta" variant="primary" size="lg"><sd-icon name="sparkle" />Plan this weekend</sd-button>
          </sd-empty>
          <sd-section class="sd-mt-6" title="Planned around" subtitle="Change any of this on Family.">
            <sd-list card>
              <sd-list-item title="The Browns, Port Credit" subtitle="2 parents · Eli 9 · Mae 5" href="/family" chevron>
                <sd-disc slot="leading" icon="user" />
              </sd-list-item>
              <sd-list-item title="3 commitments" subtitle="Swim Sat 9:00 · Church Sun 10:30 · Workout 5:00" href="/family" chevron>
                <sd-disc slot="leading" icon="lock" tone="accent" />
              </sd-list-item>
              <sd-list-item title="Likes parks and theatre" subtitle="No camping · drives under 60 min" href="/family" chevron>
                <sd-disc slot="leading" icon="heart" tone="leaf" />
              </sd-list-item>
            </sd-list>
          </sd-section>
        </div>
      `,
    ),
  }),
  globals: { viewport: { value: 'mobile' } },
  parameters: {
    docs: {
      description: {
        story:
          'Before the first plan: header actions are gone, a warm `sd-empty` holds the one coral button, and "Planned around" shows what the planner will respect, each row linking to Family.',
      },
    },
  },
};
