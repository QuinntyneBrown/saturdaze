import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  output,
} from '@angular/core';

import { Avatar, AvatarTone } from '../avatar/avatar';
import { Icon } from '../icon/icon';

/**
 * The family's thumbs on a restaurant: one cell per member. Mirrors
 * `.vote-row` in docs/mocks-v2/styles/app.css. Pressing the current vote
 * clears it; `voteChange` carries the member index and the next vote.
 */

export type Vote = 'up' | 'down' | 'none';

export interface VoteCell {
  readonly name: string;
  readonly tone: AvatarTone;
  readonly vote: Vote;
}

@Component({
  selector: 'sd-vote-row',
  standalone: true,
  imports: [Avatar, Icon],
  templateUrl: './vote-row.html',
  styleUrl: './vote-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'vote-row',
    role: 'group',
    '[attr.aria-label]': 'label()',
    '[attr.disabled]': 'disabled() ? "" : null',
  },
})
export class VoteRow {
  readonly votes = input<readonly VoteCell[]>([]);
  readonly label = input<string>('Family vote');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly voteChange = output<{ index: number; vote: Vote }>();

  protected cast(index: number, direction: 'up' | 'down'): void {
    if (this.disabled()) return;
    const current = this.votes()[index]?.vote ?? 'none';
    this.voteChange.emit({ index, vote: current === direction ? 'none' : direction });
  }
}
