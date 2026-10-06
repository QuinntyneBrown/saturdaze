import type { StoryObj } from '@storybook/angular';

import type { Empty } from 'components';

export const Default: StoryObj<Empty & { title: string }> = {
  args: {
    title: 'Nothing here yet',
    body: 'Plan this weekend and it shows up here on Monday, ready to rate.',
    icon: 'star',
    tone: 'default',
    warm: false,
    note: '',
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="sd-narrow">
        <sd-empty [title]="title" [body]="body" [icon]="icon" [tone]="tone" [warm]="warm" [note]="note">
          <sd-button slot="cta" variant="quiet" href="/weekend">
            Go to this weekend
            <sd-icon slot="trailing" name="arrow_right" />
          </sd-button>
        </sd-empty>
      </div>
    `,
  }),
};
