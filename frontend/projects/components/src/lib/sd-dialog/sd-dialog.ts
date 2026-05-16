import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';

/**
 * Bottom-sheet at `<720px`, centered modal at `≥720px`. When `static` is
 * present the dialog renders inline (used by the gallery page so every
 * variant can be reviewed at once).
 *
 * Mirrors `docs/mocks/components/sd-dialog.js`.
 */

@Component({
  selector: 'sd-dialog',
  standalone: true,
  templateUrl: './sd-dialog.html',
  styleUrl: './sd-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.open]': 'open() ? "" : null',
    '[attr.static]': 'staticMode() ? "" : null',
    '[attr.title]': 'dialogTitle() || null',
    '[attr.subtitle]': 'subtitle() || null',
  },
})
export class SdDialog {
  readonly open = input(false, { transform: booleanAttribute });
  readonly staticMode = input(false, {
    alias: 'static',
    transform: booleanAttribute,
  });
  readonly dialogTitle = input<string>('', { alias: 'title' });
  readonly subtitle = input<string>('');
}
