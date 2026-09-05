import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  output,
} from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * One row of a day's timeline. Mirrors `.block` in
 * docs/mocks-v2/styles/app.css: time gutter, rail with an icon disc, body
 * (title, one-line subtitle, chips), hover actions from 720px and a
 * chevron that opens the details dialog on phones.
 *
 * Chips and action buttons are projected (`[slot=chips]`, `[slot=actions]`)
 * so the page owns which ones apply. `drive` rows are compact and carry no
 * actions.
 */
@Component({
  selector: 'sd-block',
  standalone: true,
  imports: [Icon],
  templateUrl: './block.html',
  styleUrl: './block.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    role: 'listitem',
    '[class.block--commitment]': 'commitment()',
    '[class.block--locked]': 'locked()',
    '[class.block--drive]': 'drive()',
    '[class.block--errand]': 'errand()',
    '[class.block--done]': 'done()',
    '[attr.time]': 'time() || null',
    '[attr.title]': 'blockTitle() || null',
    '[attr.commitment]': 'commitment() ? "" : null',
    '[attr.locked]': 'locked() ? "" : null',
    '[attr.drive]': 'drive() ? "" : null',
    '[attr.errand]': 'errand() ? "" : null',
    '[attr.done]': 'done() ? "" : null',
  },
})
export class Block {
  readonly time = input<string>('');
  readonly duration = input<string>('');
  readonly icon = input<string>('sparkle');
  readonly blockTitle = input<string>('', { alias: 'title' });
  readonly subtitle = input<string>('');
  readonly commitment = input(false, { transform: booleanAttribute });
  readonly locked = input(false, { transform: booleanAttribute });
  readonly drive = input(false, { transform: booleanAttribute });
  readonly errand = input(false, { transform: booleanAttribute });
  readonly done = input(false, { transform: booleanAttribute });
  /** Hide the phone chevron (read-only shared view). */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** The phone chevron / row tap. */
  readonly details = output<void>();
}
