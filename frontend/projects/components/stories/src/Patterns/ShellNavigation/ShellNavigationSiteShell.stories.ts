import type { StoryObj } from '@storybook/angular';

export const SiteShell: StoryObj = {
  name: 'Public site bar',
  render: () => ({
    template: `
      <sd-sitebar cta />
      <main id="main" class="sd-frame sd-frame--site">
        <div class="sd-narrow sd-stack sd-stack--lg">
          <sd-page-header title="Terms and privacy" subtitle="The short version first, then the detail." />
          <p>
            Saturdaze uses the minimum information needed to make practical family plans: your family's names and
            ages, your home area, and the commitments you tell it about.
          </p>
          <p>Account owners can review, export or remove their information at any time from the Family screen.</p>
        </div>
      </main>
    `,
  }),
  globals: { viewport: { value: 'mobile' } },
  parameters: {
    docs: {
      description: {
        story:
          'Signed-out public pages (`data.shell: "site"`) get `sd-sitebar` at every width and no bottom nav; `.sd-frame--site` drops the nav clearance.',
      },
    },
  },
};
