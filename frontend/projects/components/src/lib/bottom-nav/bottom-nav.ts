import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { Router } from '@angular/router';

import { Icon } from '../icon/icon';

/**
 * Fixed-bottom primary navigation. Becomes an icon rail at tablet width and
 * a labelled sidebar at desktop width.
 *
 * Uses real Angular route hrefs so copy-link, modifier-click, and direct
 * opens all resolve to production routes. Plain clicks are still intercepted
 * so navigation stays inside the SPA.
 */

export type BottomNavKey = 'home' | 'activities' | 'saved' | 'profile';

interface NavItem {
  key: BottomNavKey;
  label: string;
  icon: string;
  href: string;
  route: string;
}

const ITEMS: readonly NavItem[] = [
  { key: 'home',       label: 'Weekend',  icon: 'home',    href: '/weekend',    route: '/weekend' },
  { key: 'activities', label: 'Discover', icon: 'sparkle', href: '/activities', route: '/activities' },
  { key: 'saved',      label: 'Saved',    icon: 'heart',   href: '/saved',      route: '/saved' },
  { key: 'profile',    label: 'Family',   icon: 'user',    href: '/profile',    route: '/profile' },
];

@Component({
  selector: 'sd-bottom-nav',
  standalone: true,
  imports: [Icon],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.active]': 'active()',
  },
})
export class BottomNav {
  readonly active = input<BottomNavKey>('home');

  protected readonly items = ITEMS;

  private readonly router = inject(Router);

  protected onNavigate(event: MouseEvent, route: string): void {
    // Let modifier-clicks (Ctrl/Cmd/middle-click) keep their browser meaning;
    // intercept only the plain primary-button click for the SPA case.
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void this.router.navigateByUrl(route);
  }

  protected isActive(key: BottomNavKey): boolean {
    return this.active() === key;
  }
}
