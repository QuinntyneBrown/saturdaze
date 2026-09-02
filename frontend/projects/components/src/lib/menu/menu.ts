import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  output,
} from '@angular/core';
import { Router } from '@angular/router';

import { Disc } from '../disc/disc';
import { Icon } from '../icon/icon';
import { navigateInApp } from '../shared/in-app-link';

/**
 * A short list of actions. Mirrors `.menu` in docs/mocks-v2/styles/app.css
 * as an anchored popover (account menu, Weekend "More" from 720px) and, with
 * `sheet`, the row list rendered inside a bottom-sheet dialog on phones.
 * `select` emits the chosen item; items with `href` also navigate.
 */

export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly sub?: string;
  readonly tone?: 'default' | 'warn';
  readonly href?: string;
}

@Component({
  selector: 'sd-menu',
  standalone: true,
  imports: [Disc, Icon],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'menu',
    role: 'menu',
    '[class.menu--sheet]': 'sheet()',
    '[attr.aria-label]': 'label()',
    '[attr.sheet]': 'sheet() ? "" : null',
    '(keydown)': 'onKey($event)',
  },
})
export class Menu {
  private readonly router = inject(Router, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly items = input<readonly MenuItem[]>([]);
  /** Header line (the account email). */
  readonly header = input<string>('');
  readonly label = input<string>('Menu');
  readonly sheet = input(false, { transform: booleanAttribute });
  readonly select = output<MenuItem>();

  protected choose(item: MenuItem, event: MouseEvent): void {
    this.select.emit(item);
    if (item.href && this.router) navigateInApp(this.router, event, item.href);
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const buttons = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    if (!buttons.length) return;
    const current = buttons.indexOf(document.activeElement as HTMLElement);
    const delta = event.key === 'ArrowDown' ? 1 : -1;
    const next = (current + delta + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[next]?.focus();
  }
}
