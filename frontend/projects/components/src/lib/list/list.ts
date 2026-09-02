import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * A stack of `sd-list-item`s. Mirrors `.list` / `.list--card` in
 * docs/mocks-v2/styles/app.css. `card` draws the surface, border and
 * radius and pads the rows.
 */
@Component({
  selector: 'sd-list',
  standalone: true,
  templateUrl: './list.html',
  styleUrl: './list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'list',
    role: 'list',
    '[class.list--card]': 'card()',
    '[attr.card]': 'card() ? "" : null',
  },
})
export class List {
  readonly card = input(false, { transform: booleanAttribute });
}
