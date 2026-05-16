import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { Avatar, AvatarTone } from '../avatar/avatar';
import { Icon } from '../icon/icon';

/**
 * One row in the family vote UI. Mirrors `docs/mocks/components/sd-vote-row.js`.
 * Carries a tonal avatar, the member's name, and up/down buttons. The
 * currently-selected vote drives the active state on the up/down disks.
 */

export type Vote = 'up' | 'down' | 'none';

@Component({
  selector: 'sd-vote-row',
  standalone: true,
  imports: [Avatar, Icon],
  templateUrl: './vote-row.html',
  styleUrl: './vote-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.name]': 'name()',
    '[attr.tone]': 'tone()',
    '[attr.vote]': 'vote()',
  },
})
export class VoteRow {
  readonly name = input<string>('');
  readonly tone = input<AvatarTone>('leaf');
  readonly vote = input<Vote>('none');
}
