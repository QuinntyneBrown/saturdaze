import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * A quiet note block with a leading glyph ("Why this", "Keeping …").
 * Mirrors `.well` in docs/mocks-v2/styles/app.css. `title` renders the bold
 * first line; the default slot is the body.
 */

export type WellTone = 'default' | 'accent' | 'warn' | 'primary';

@Component({
  selector: 'sd-well',
  standalone: true,
  imports: [Icon],
  templateUrl: './well.html',
  styleUrl: './well.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'well',
    '[class.well--accent]': 'tone() === "accent"',
    '[class.well--warn]': 'tone() === "warn"',
    '[class.well--primary]': 'tone() === "primary"',
    '[attr.tone]': 'tone() === "default" ? null : tone()',
    '[attr.title]': 'wellTitle() || null',
  },
})
export class Well {
  readonly icon = input<string>('sparkle');
  readonly tone = input<WellTone>('default');
  readonly wellTitle = input<string>('', { alias: 'title' });
}
