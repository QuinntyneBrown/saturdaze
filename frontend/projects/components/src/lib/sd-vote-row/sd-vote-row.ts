import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { SdAvatar, SdAvatarTone } from '../sd-avatar/sd-avatar';
import { SdIcon } from '../sd-icon/sd-icon';

/**
 * One row in the family vote UI. Mirrors `docs/mocks/components/sd-vote-row.js`.
 * Carries a tonal avatar, the member's name, and up/down buttons. The
 * currently-selected vote drives the active state on the up/down disks.
 */

export type SdVote = 'up' | 'down' | 'none';

@Component({
  selector: 'sd-vote-row',
  standalone: true,
  imports: [SdAvatar, SdIcon],
  templateUrl: './sd-vote-row.html',
  styleUrl: './sd-vote-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.name]': 'name()',
    '[attr.tone]': 'tone()',
    '[attr.vote]': 'vote()',
  },
})
export class SdVoteRow {
  readonly name = input<string>('');
  readonly tone = input<SdAvatarTone>('leaf');
  readonly vote = input<SdVote>('none');
}
