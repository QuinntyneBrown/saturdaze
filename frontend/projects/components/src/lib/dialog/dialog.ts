import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
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
 * (`role="dialog"`, header, content, action slots) and is portalled into
 * CDK's overlay, which owns the backdrop, focus trap, ESC handling, and
 * scroll lock. Bottom-sheet at `<720px`, centered modal at `≥720px`.
 *
 * The `static` input renders the sheet inline (no overlay) for the design
 * gallery so every variant can be reviewed on one page — production code
 * should not set it.
 */
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
  readonly staticMode = input(false, {
    alias: 'static',
    transform: booleanAttribute,
  });
  readonly dialogTitle = input<string>('', { alias: 'title' });
  readonly subtitle = input<string>('');
}
