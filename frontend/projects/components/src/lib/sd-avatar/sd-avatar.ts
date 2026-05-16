import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/**
 * Initials disc. Mirrors `docs/mocks/components/sd-avatar.js`.
 * Tone drives the background / ink colour. `size` switches between sm/md/lg/xl.
 */

export type SdAvatarTone = 'default' | 'leaf' | 'sky' | 'sun' | 'primary' | 'indoor';
export type SdAvatarSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'sd-avatar',
  standalone: true,
  templateUrl: './sd-avatar.html',
  styleUrl: './sd-avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.name]': 'name()',
    '[attr.tone]': 'tone() === "default" ? null : tone()',
    '[attr.size]': 'size() === "md" ? null : size()',
  },
})
export class SdAvatar {
  readonly name = input<string>('?');
  readonly tone = input<SdAvatarTone>('default');
  readonly size = input<SdAvatarSize>('md');

  protected readonly initials = computed<string>(() =>
    this.name()
      .split(/\s+/)
      .map((p) => p[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  );
}
