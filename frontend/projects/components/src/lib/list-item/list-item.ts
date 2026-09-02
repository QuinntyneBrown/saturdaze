import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';

import { Icon } from '../icon/icon';
import { navigateInApp } from '../shared/in-app-link';

/**
 * One row of an `sd-list`. Mirrors `.list__item` in
 * docs/mocks-v2/styles/app.css. The host is the list item; the inner row is
 * a `<button>` when `action` is set (emits `pressed`), an in-app `<a>` when
 * `href` is set, otherwise a `<div>`. Leading / trailing slots carry
 * discs, avatars, chips and controls; `chevron` adds the trailing glyph.
 *
 * The single-template + `NgTemplateOutlet` shape keeps the ng-content slots
 * in one place — duplicating them across branches drops projected content.
 */
@Component({
  selector: 'sd-list-item',
  standalone: true,
  imports: [NgTemplateOutlet, Icon],
  templateUrl: './list-item.html',
  styleUrl: './list-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'listitem',
    '[attr.title]': 'rowTitle() || null',
    '[attr.subtitle]': 'subtitle() || null',
    '[attr.href]': 'href() || null',
    '[attr.action]': 'action() ? "" : null',
    '[attr.chevron]': 'chevron() ? "" : null',
  },
})
export class ListItem {
  private readonly router = inject(Router, { optional: true });

  readonly rowTitle = input<string>('', { alias: 'title' });
  readonly subtitle = input<string>('');
  /** Render the subtitle above the title (a label over a value). */
  readonly subtitleFirst = input(false, { transform: booleanAttribute });
  readonly href = input<string>('');
  /** Render the row as a `<button>`; `pressed` emits on click. */
  readonly action = input(false, { transform: booleanAttribute });
  readonly chevron = input(false, { transform: booleanAttribute });
  /** Accessible name override for action rows (defaults to the row text). */
  readonly label = input<string>('');
  readonly pressed = output<void>();

  protected onAnchorClick(event: MouseEvent): void {
    if (this.router) navigateInApp(this.router, event, this.href());
  }
}
