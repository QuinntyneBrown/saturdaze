import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * An icon in a coloured circle. Mirrors `.disc` (and `.weather-disc`) in
 * docs/mocks-v2/styles/app.css. Decorative: the host is `aria-hidden`.
 */

export type DiscTone =
  | 'default'
  | 'accent'
  | 'primary'
  | 'warn'
  | 'sun'
  | 'sky'
  | 'leaf'
  | 'indoor'
  | 'surface';

export type DiscSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'sd-disc',
  standalone: true,
  imports: [Icon],
  templateUrl: './disc.html',
  styleUrl: './disc.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'disc',
    'aria-hidden': 'true',
    '[class.disc--sm]': 'size() === "sm"',
    '[class.disc--lg]': 'size() === "lg"',
    '[class.disc--xl]': 'size() === "xl"',
    '[class.disc--accent]': 'tone() === "accent"',
    '[class.disc--primary]': 'tone() === "primary"',
    '[class.disc--warn]': 'tone() === "warn"',
    '[class.disc--sun]': 'tone() === "sun"',
    '[class.disc--sky]': 'tone() === "sky"',
    '[class.disc--leaf]': 'tone() === "leaf"',
    '[class.disc--indoor]': 'tone() === "indoor"',
    '[class.disc--surface]': 'tone() === "surface"',
    '[attr.icon]': 'icon()',
    '[attr.tone]': 'tone() === "default" ? null : tone()',
    '[attr.size]': 'size() === "md" ? null : size()',
  },
})
export class Disc {
  readonly icon = input<string>('sparkle');
  readonly tone = input<DiscTone>('default');
  readonly size = input<DiscSize>('md');

  protected readonly iconSize = computed(() => (this.size() === 'xl' ? 26 : this.size() === 'sm' ? 16 : 20));
}
