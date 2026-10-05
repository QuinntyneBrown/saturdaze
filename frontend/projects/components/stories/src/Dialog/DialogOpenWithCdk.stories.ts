import { Dialog as CdkDialog, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, Dialog, Icon } from 'components';

/** The app's sign-out confirmation, as a dialog component opened through CDK. */
@Component({
  selector: 'story-sign-out-dialog',
  standalone: true,
  imports: [Dialog, Button, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-dialog title="Sign out?" subtitle="Your family and weekends stay saved.">
      <sd-button slot="actions" variant="quiet" type="button" (click)="ref.close(false)">Stay signed in</sd-button>
      <sd-button slot="actions" variant="danger" type="button" (click)="ref.close(true)">
        <sd-icon name="sign_out" />
        Sign out
      </sd-button>
    </sd-dialog>
  `,
})
class SignOutDialogDemo {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}

/**
 * Opens the dialog the way the app does (`DIALOG_OPTIONS` in
 * confirm-dialog.ts); `.storybook/storybook.scss` carries the app's
 * `.sd-dialog-*` overlay rules.
 */
@Component({
  selector: 'story-dialog-launcher',
  standalone: true,
  imports: [Button, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
      <sd-button variant="quiet" warnText type="button" (click)="open()"><sd-icon slot="leading" name="sign_out" />Sign out</sd-button>
      <span class="sd-text-soft" aria-live="polite">{{ result() }}</span>
    </div>
  `,
})
class DialogLauncher {
  private readonly dialog = inject(CdkDialog);
  protected readonly result = signal('');

  protected open(): void {
    const ref = this.dialog.open<boolean>(SignOutDialogDemo, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      panelClass: 'sd-dialog-panel',
      backdropClass: 'sd-dialog-backdrop',
    });
    ref.closed.subscribe((confirmed) => {
      this.result.set(confirmed ? 'Signed out.' : 'Still signed in.');
    });
  }
}

export const OpenWithCdk: StoryObj<Dialog> = {
  decorators: [moduleMetadata({ imports: [DialogLauncher] })],
  render: () => ({
    template: `<story-dialog-launcher />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A real modal: the button calls CDK `Dialog.open(SignOutDialog, { autoFocus: \'first-tabbable\', restoreFocus: true, panelClass: \'sd-dialog-panel\', backdropClass: \'sd-dialog-backdrop\' })`. CDK supplies the backdrop, focus trap and Escape; the × or either button closes the `DialogRef`. Resize below 720px to see the bottom sheet.',
      },
    },
  },
};
