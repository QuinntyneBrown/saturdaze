import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  output,
} from '@angular/core';

import { Button } from '../button/button';
import { Chip } from '../chip/chip';
import { Disc, DiscTone } from '../disc/disc';
import { Icon } from '../icon/icon';
import { Vote, VoteCell, VoteRow } from '../vote-row/vote-row';

/**
 * A restaurant pick on Ideas · Food. Mirrors the food `.card` in
 * docs/mocks-v2/pages/ideas.food.html: fork disc, name, style line, chips,
 * the family vote row, "See menu" and "Lock it in". The top pick spans the
 * grid; a locked pick gets the accent border and no lock button; its
 * siblings are dimmed with voting disabled.
 */
@Component({
  selector: 'sd-food-card',
  standalone: true,
  imports: [Button, Chip, Disc, Icon, VoteRow],
  templateUrl: './food-card.html',
  styleUrl: './food-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'card',
    '[class.card--span]': 'topPick()',
    '[class.card--locked]': 'locked()',
    '[class.card--dimmed]': 'dimmed()',
    '[attr.title]': 'cardTitle() || null',
    '[attr.top-pick]': 'topPick() ? "" : null',
    '[attr.locked]': 'locked() ? "" : null',
    '[attr.dimmed]': 'dimmed() ? "" : null',
  },
})
export class FoodCard {
  readonly cardTitle = input<string>('', { alias: 'title' });
  readonly meta = input<string>('');
  readonly tone = input<DiscTone>('default');
  readonly topPick = input(false, { transform: booleanAttribute });
  readonly locked = input(false, { transform: booleanAttribute });
  /** "Locked for lunch" / "Locked for dinner". */
  readonly lockedLabel = input<string>('Locked');
  readonly dimmed = input(false, { transform: booleanAttribute });
  readonly menuUrl = input<string>('');
  readonly votes = input<readonly VoteCell[]>([]);
  readonly votesDisabled = input(false, { transform: booleanAttribute });
  readonly voteChange = output<{ index: number; vote: Vote }>();
  readonly lockIn = output<void>();
}
