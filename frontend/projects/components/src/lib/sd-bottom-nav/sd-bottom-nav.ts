import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { Router } from '@angular/router';

import { SdIcon } from '../sd-icon/sd-icon';

/**
 * Fixed-bottom primary navigation. Becomes an icon rail at tablet width and
 * a labelled sidebar at desktop width.
 *
 * Mirrors `docs/mocks/components/sd-bottom-nav.js` 1:1 so the same e2e POM
 * (which selects via `a[href$="home.html"]` for parity with the static mock)
 * works against both worlds. Click is intercepted so navigation actually
 * resolves through Angular's router rather than triggering a page reload.
 */

export type SdBottomNavKey = 'home' | 'activities' | 'saved' | 'profile';

interface NavItem {
  key: SdBottomNavKey;
  label: string;
  icon: string;
  href: string;   // mirrors the mock's static href so visual + selectors line up
  route: string;  // Angular route the click should resolve to
}

const ITEMS: readonly NavItem[] = [
  { key: 'home',       label: 'Weekend',  icon: 'home',    href: 'home.html',       route: '/' },
  { key: 'activities', label: 'Discover', icon: 'sparkle', href: 'activities.html', route: '/activities' },
  { key: 'saved',      label: 'Saved',    icon: 'heart',   href: 'saved.html',      route: '/saved' },
  { key: 'profile',    label: 'Family',   icon: 'user',    href: 'profile.html',    route: '/profile' },
];

@Component({
  selector: 'sd-bottom-nav',
  standalone: true,
  imports: [SdIcon],
  templateUrl: './sd-bottom-nav.html',
  styleUrl: './sd-bottom-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.active]': 'active()',
  },
})
export class SdBottomNav {
  readonly active = input<SdBottomNavKey>('home');

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

  protected isActive(key: SdBottomNavKey): boolean {
    return this.active() === key;
  }
}
