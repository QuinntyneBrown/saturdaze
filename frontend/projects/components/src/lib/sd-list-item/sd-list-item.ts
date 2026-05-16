import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/**
 * Generic row. Mirrors `docs/mocks/components/sd-list-item.js`. When `href`
 * is set, the row is rendered as an `<a>`; otherwise as a `<div>`. Leading
 * and trailing slots carry icons / chips / controls.
 *
 * The single-template + `NgTemplateOutlet` shape (see `sd-list-item.html`)
 * keeps the ng-content slots in one place — duplicating them across an
 * @if/@else with the same selector silently drops the projected content.
 */

@Component({
  selector: 'sd-list-item',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './sd-list-item.html',
  styleUrl: './sd-list-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.title]': 'rowTitle() || null',
    '[attr.subtitle]': 'subtitle() || null',
    '[attr.href]': 'href() || null',
    '[attr.compact]': 'compact() ? "" : null',
    '[attr.flat]': 'flat() ? "" : null',
  },
})
export class SdListItem {
  readonly rowTitle = input<string>('', { alias: 'title' });
  readonly subtitle = input<string>('');
  readonly href = input<string>('');
  readonly compact = input(false, { transform: booleanAttribute });
  readonly flat = input(false, { transform: booleanAttribute });
}
