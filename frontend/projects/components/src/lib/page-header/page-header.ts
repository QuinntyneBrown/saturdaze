import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { navigateInApp } from '../shared/in-app-link';

/**
 * The first thing on every core screen: h1, one subtitle, the actions.
 * Mirrors `.page-header` in docs/mocks-v2/styles/app.css.
 *
 * Slots: `[slot=primary]` (the one coral button), `[slot=actions]` (up to
 * two quiet buttons), `[slot=more]` (the overflow button). Below 720px the
 * primary spans the row, quiet buttons sit 2-up under it and More sits
 * beside the h1; from 720px everything lines up at the end.
 *
 * `backHref` renders an eyebrow link above the title from 720px and a back
 * icon button beside it below (Review submissions → Family).
 */
@Component({
  selector: 'sd-page-header',
  standalone: true,
  imports: [Button, Icon],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page-header',
    '[attr.title]': 'pageTitle() || null',
    '[attr.subtitle]': 'subtitle() || null',
  },
})
export class PageHeader {
  private readonly router = inject(Router, { optional: true });

  readonly pageTitle = input<string>('', { alias: 'title' });
  readonly subtitle = input<string>('');
  readonly backHref = input<string>('');
  readonly backLabel = input<string>('Back');

  protected onBack(event: MouseEvent): void {
    if (this.router) navigateInApp(this.router, event, this.backHref());
  }
}
