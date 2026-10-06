import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

export const LikesEditor: StoryObj = {
  name: 'Likes and dislikes editor',
  render: () => {
    const likes = signal(['Parks', 'Short hikes', 'Zoo', 'Rec Room', 'Lavender', 'Live theatre']);
    const dislikes = signal(['Camping', 'Drives over 60 min']);
    return {
      props: { likes, dislikes },
      template: `
        <div style="padding: 24px var(--layoutGutter); display: grid; justify-items: center">
          <sd-dialog static wide title="Likes and dislikes" subtitle="Liked tags get a boost. Disliked ones are left out.">
            <div class="sd-stack" style="--gap: 14px">
              <sd-chip-input label="Likes" tone="leaf" [ngModel]="likes()" (ngModelChange)="likes.set($event)" />
              <sd-chip-input label="Dislikes" tone="warn" [ngModel]="dislikes()" (ngModelChange)="dislikes.set($event)" />
            </div>
            <sd-button slot="actions" variant="quiet">Cancel</sd-button>
            <sd-button slot="actions" variant="primary">Save</sd-button>
          </sd-dialog>
        </div>
      `,
    };
  },
  globals: { viewport: { value: 'tablet' } },
  parameters: {
    docs: {
      story: { height: '520px' },
      description: {
        story:
          '"Edit" on Likes and dislikes opens this dialog (rendered inline here with `static`). Each `sd-chip-input` is a CVA over `string[]`: type and press Enter or comma to add, Backspace on an empty field removes the last chip.',
      },
    },
  },
};
