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

export type AvatarTone = 'default' | 'leaf' | 'sky' | 'sun' | 'primary' | 'indoor';
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'sd-avatar',
  standalone: true,
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.name]': 'name()',
    '[attr.tone]': 'tone() === "default" ? null : tone()',
    '[attr.size]': 'size() === "md" ? null : size()',
  },
})
export class Avatar {
  readonly name = input<string>('?');
  readonly tone = input<AvatarTone>('default');
  readonly size = input<AvatarSize>('md');

  protected readonly initials = computed<string>(() =>
    this.name()
      .split(/\s+/)
      .map((p) => p[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  );
}
