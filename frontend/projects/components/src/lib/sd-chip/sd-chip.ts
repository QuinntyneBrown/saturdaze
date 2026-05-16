import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

/**
 * Small status / category tag. Mirrors `docs/mocks/components/sd-chip.js`.
 * Default tone is the surface-2 fill; the tone palette lives in SCSS so it
 * can pivot on `:host([tone="..."])`.
 */

export type SdChipTone =
  | 'default'
  | 'sun'
  | 'sky'
  | 'leaf'
  | 'indoor'
  | 'warn'
  | 'accent'
  | 'primary';

@Component({
  selector: 'sd-chip',
  standalone: true,
  templateUrl: './sd-chip.html',
  styleUrl: './sd-chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.tone]': 'tone() === "default" ? null : tone()',
  },
})
export class SdChip {
  readonly tone = input<SdChipTone>('default');
}
