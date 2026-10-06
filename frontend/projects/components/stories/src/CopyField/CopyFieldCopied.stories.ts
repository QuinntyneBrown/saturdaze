import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { CopyField } from 'components';

export const Copied: StoryObj<CopyField> = {
  render: () => {
    const last = signal('');
    return {
      props: { last, onCopied: (text: string) => last.set(text) },
      template: `
        <div style="max-width: 440px; display: grid; gap: 8px">
          <sd-copy-field value="https://saturdaze.app/sample-weekend?share=7f3c9a2e" (copied)="onCopied($event)" />
          <p class="sd-text-xs sd-text-soft">{{ last() ? 'copied emitted: ' + last() : 'Press Copy.' }}</p>
        </div>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story: 'Pressing Copy flips the button to "Copied" (and `aria-pressed`) for two seconds and emits `copied` with the value.',
      },
    },
  },
};
