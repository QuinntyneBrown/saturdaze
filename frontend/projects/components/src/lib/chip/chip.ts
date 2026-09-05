import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  output,
} from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * Small status / category tag. Mirrors `.chip` in docs/mocks-v2/styles/app.css.
 * The host is the chip (`class="chip chip--sun"`); project an `<sd-icon>`
 * first for a leading glyph. `removable` renders the × used by the
 * likes / dislikes editor.
 */

export type ChipTone =
  | 'default'
  | 'sun'
  | 'sky'
  | 'leaf'
  | 'indoor'
  | 'accent'
  | 'primary'
  | 'warn'
  | 'ink';

export type ChipSize = 'md' | 'sm';

@Component({
  selector: 'sd-chip',
  standalone: true,
  imports: [Icon],
  templateUrl: './chip.html',
  styleUrl: './chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'chip',
    '[class.chip--sun]': 'tone() === "sun"',
    '[class.chip--sky]': 'tone() === "sky"',
    '[class.chip--leaf]': 'tone() === "leaf"',
    '[class.chip--indoor]': 'tone() === "indoor"',
    '[class.chip--accent]': 'tone() === "accent"',
    '[class.chip--primary]': 'tone() === "primary"',
    '[class.chip--warn]': 'tone() === "warn"',
    '[class.chip--ink]': 'tone() === "ink"',
    '[class.chip--sm]': 'size() === "sm"',
    '[class.chip--count]': 'count()',
    '[attr.tone]': 'tone() === "default" ? null : tone()',
    '[attr.size]': 'size() === "md" ? null : size()',
    '[attr.removable]': 'removable() ? "" : null',
  },
})
export class Chip {
  readonly tone = input<ChipTone>('default');
  readonly size = input<ChipSize>('md');
  /** Centred numeric badge (the "3" beside Review submissions). */
  readonly count = input(false, { transform: booleanAttribute });
  /** Trailing × button; `remove` emits when it is pressed. */
  readonly removable = input(false, { transform: booleanAttribute });
  /** Accessible name for the × (defaults to "Remove"). */
  readonly removeLabel = input<string>('Remove');
  readonly remove = output<void>();
}
