import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';

/**
 * Presentational sheet shell used inside a CDK dialog.
 *
 * Real modals are opened through `@angular/cdk/dialog`:
 *
 * ```ts
 * private readonly dialog = inject(Dialog);
 * this.dialog.open(SomeDialogContentComponent, { ... });
 * ```
 *
 * The component itself renders the bottom-sheet / centered-modal visuals
 * (header, content, action slots) and is portalled into CDK's overlay,
 * which owns the backdrop, focus trap, ESC handling, scroll lock and the
 * `role="dialog"` container. On first render the shell labels that
 * container with its own `<h2>` so assistive tech announces the title
 * (L2-036/037). Bottom-sheet at `<720px`, centered modal at `≥720px`.
 *
 * The `static` input renders the sheet inline (no overlay) for the design
 * gallery so every variant can be reviewed on one page — production code
 * should not set it.
 */

let nextDialogId = 0;

@Component({
  selector: 'sd-dialog',
  standalone: true,
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.static]': 'staticMode() ? "" : null',
    '[attr.title]': 'dialogTitle() || null',
    '[attr.subtitle]': 'subtitle() || null',
  },
})
export class Dialog {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly staticMode = input(false, {
    alias: 'static',
    transform: booleanAttribute,
  });
  readonly dialogTitle = input<string>('', { alias: 'title' });
  readonly subtitle = input<string>('');

  /** Unique id of the `<h2>`; the CDK container's `aria-labelledby` points at it. */
  protected readonly titleId = `sd-dialog-title-${nextDialogId++}`;

  constructor() {
    afterNextRender(() => {
      const container = this.host.nativeElement.closest('[role="dialog"]');
      if (container && !container.hasAttribute('aria-labelledby')) {
        container.setAttribute('aria-labelledby', this.titleId);
      }
    });
  }
}
