import type { StoryObj } from '@storybook/angular';

import type { Dialog } from 'components';

import { SAMPLE_PHOTO } from '../Media/media-sample';

export const WithMedia: StoryObj<Dialog> = {
  render: () => ({
    props: { photo: SAMPLE_PHOTO },
    template: `
      <sd-dialog static title="Make this the primary photo?" subtitle="Terre Bleu Lavender Farm · the photo on every idea card and cover.">
        <sd-media slot="media" ratio="4:3" [photo]="photo" eager />
        <sd-well icon="star" tone="primary" title="5 weekend covers will change">
          Weekends whose cover follows this place show the new primary on their next load.
        </sd-well>
        <sd-button slot="actions" variant="quiet" type="button">Cancel</sd-button>
        <sd-button slot="actions" variant="primary" type="button"><sd-icon name="star" />Make primary</sd-button>
      </sd-dialog>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A dialog about one photo puts it in `[slot=media]`: first in the body and never wider than 240px, so the decision stays above the fold on a phone.',
      },
    },
  },
};
