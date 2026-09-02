import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  InjectionToken,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';

/**
 * Presentational panel used inside a CDK dialog. Mirrors `.dialog__panel`
 * in docs/mocks-v2/styles/app.css: a bottom sheet below 720px (grip, top
 * corners), a centred modal from 720px.
 *
 * Real modals are opened through `@angular/cdk/dialog`, which owns the
 * backdrop, focus trap, ESC and the `role="dialog"` container; pass
 * `panelClass: 'sd-dialog-panel'` so the overlay aligns the sheet. On first
 * render the panel labels that container with its own `<h2>`.
 *
 * Slots: default (body), `[slot=actions]` (quiet then primary; on phones the
 * primary lands on top), `[slot=actions-left]` (a destructive "Remove" that
 * stays on the left from 720px).
 *
 * `static` renders the panel inline for the design gallery.
 */

let nextDialogId = 0;

/**
 * Provide `true` to render every `sd-dialog` in the subtree inline (the
 * design gallery does this per specimen instead of setting `static` on each
 * dialog component's template).
 */
export const SD_DIALOG_STATIC = new InjectionToken<boolean>('SD_DIALOG_STATIC');

@Component({
  selector: 'sd-dialog',
  standalone: true,
  imports: [Button, Icon],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'dialog',
    '[class.dialog--specimen]': 'isStatic()',
    '[class.dialog--wide]': 'wide()',
    '[attr.static]': 'isStatic() ? "" : null',
    '[attr.wide]': 'wide() ? "" : null',
    '[attr.title]': 'dialogTitle() || null',
    '[attr.subtitle]': 'subtitle() || null',
  },
})
export class Dialog {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ref = inject(DialogRef, { optional: true });

  readonly staticMode = input(false, { alias: 'static', transform: booleanAttribute });
  private readonly forcedStatic = inject(SD_DIALOG_STATIC, { optional: true }) ?? false;
  /** Inline when the `static` input or the `SD_DIALOG_STATIC` provider says so. */
  readonly isStatic = computed(() => this.staticMode() || this.forcedStatic);
  readonly dialogTitle = input<string>('', { alias: 'title' });
  readonly subtitle = input<string>('');
  /** 520px panel for forms. */
  readonly wide = input(false, { transform: booleanAttribute });
  readonly closeLabel = input<string>('Close');
  /** Emits when the × is pressed; the CDK ref (if any) is closed too. */
  readonly closed = output<void>();

  /** Unique id of the `<h2>`; the CDK container's `aria-labelledby` points at it. */
  protected readonly titleId = `sd-dialog-title-${nextDialogId++}`;

  constructor() {
    afterNextRender(() => {
      const container = this.host.nativeElement.closest('[role="dialog"], [role="alertdialog"]');
      if (container && !container.hasAttribute('aria-labelledby')) {
        container.setAttribute('aria-labelledby', this.titleId);
      }
    });
  }

  protected close(): void {
    this.closed.emit();
    this.ref?.close();
  }
}
