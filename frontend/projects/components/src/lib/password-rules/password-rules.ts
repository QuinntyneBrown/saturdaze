import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * Password rule checklist (L2-143). Mirrors `.rules` in
 * `docs/mocks/styles/app.css`: one `.rules__item` per rule, `--met` once the
 * typed password satisfies it. Each item ends in visually hidden "met" /
 * "not yet met" text so the state is never colour alone.
 */

export interface PasswordRule {
  label: string;
  met: boolean;
}

@Component({
  selector: 'sd-password-rules',
  standalone: true,
  imports: [Icon],
  templateUrl: './password-rules.html',
  styleUrl: './password-rules.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'rules',
    role: 'list',
    '[attr.aria-label]': 'label()',
  },
})
export class PasswordRules {
  readonly rules = input<readonly PasswordRule[]>([]);
  readonly label = input<string>('Password rules');
}
