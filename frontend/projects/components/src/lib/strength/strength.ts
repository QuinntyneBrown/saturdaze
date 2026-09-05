import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Three-segment password strength meter. Mirrors `.strength`. The host is a
 * polite live region so the label change is announced.
 */

export type StrengthLevel = 'weak' | 'ok' | 'strong';

@Component({
  selector: 'sd-strength',
  standalone: true,
  templateUrl: './strength.html',
  styleUrl: './strength.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'strength',
    'aria-live': 'polite',
    '[class.strength--weak]': 'level() === "weak"',
    '[class.strength--ok]': 'level() === "ok"',
    '[class.strength--strong]': 'level() === "strong"',
    '[attr.level]': 'level()',
  },
})
export class Strength {
  readonly level = input<StrengthLevel | null>(null);
  readonly label = input<string>('');
}
