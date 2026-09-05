import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Initials disc for a family member. Mirrors `.avatar` in
 * docs/mocks-v2/styles/app.css. Person tones: Quinn primary, Sara leaf, Eli
 * sky, Mae sun — pages map member index → tone.
 */

export type AvatarTone = 'default' | 'primary' | 'leaf' | 'sky' | 'sun' | 'indoor';
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'sd-avatar',
  standalone: true,
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'avatar',
    'aria-hidden': 'true',
    '[class.avatar--sm]': 'size() === "sm"',
    '[class.avatar--md]': 'size() === "md"',
    '[class.avatar--xl]': 'size() === "xl"',
    '[class.avatar--q]': 'tone() === "primary"',
    '[class.avatar--s]': 'tone() === "leaf"',
    '[class.avatar--e]': 'tone() === "sky"',
    '[class.avatar--m]': 'tone() === "sun"',
    '[class.avatar--indoor]': 'tone() === "indoor"',
    '[attr.name]': 'name()',
    '[attr.tone]': 'tone() === "default" ? null : tone()',
    '[attr.size]': 'size()',
  },
})
export class Avatar {
  readonly name = input<string>('?');
  readonly tone = input<AvatarTone>('default');
  /** sm 24px · md 28px · lg 32px (default) · xl 36px. */
  readonly size = input<AvatarSize>('lg');

  protected readonly initial = computed(() => (this.name().trim().charAt(0) || '?').toUpperCase());
}
