import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';

/**
 * Page through a long list: "51 to 100 of 120" with Previous and Next.
 * Mirrors `.pager` in docs/mocks/pages/admin.places.html. The host is the
 * pager; `pageChange` emits the page to show, and the consumer owns the
 * page (usually in the address, so a page is a link).
 */
@Component({
  selector: 'sd-pager',
  standalone: true,
  imports: [Button, Icon],
  templateUrl: './pager.html',
  styleUrl: './pager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pager',
    role: 'navigation',
    '[attr.aria-label]': 'label()',
  },
})
export class Pager {
  /** The page shown, from 1. */
  readonly page = input(1);
  readonly pageSize = input(50);
  readonly total = input(0);
  /** The text when there is nothing to page ("No places"). */
  readonly emptyText = input('Nothing to show');
  /** The landmark's accessible name. */
  readonly label = input('Pages');
  readonly pageChange = output<number>();

  protected readonly text = computed(() => {
    const total = this.total();
    if (total === 0) return this.emptyText();
    const from = (this.page() - 1) * this.pageSize() + 1;
    const to = Math.min(total, this.page() * this.pageSize());
    return `${from} to ${to} of ${total}`;
  });
  protected readonly hasPrevious = computed(() => this.page() > 1);
  protected readonly hasNext = computed(() => this.page() * this.pageSize() < this.total());

  protected go(page: number): void {
    this.pageChange.emit(page);
  }
}
