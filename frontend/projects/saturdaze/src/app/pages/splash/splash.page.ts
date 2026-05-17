import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button, Chip, Icon, TimelineBlock } from 'components';

/**
 * Marketing splash — pages/splash.html.
 *
 * Public surface for signed-out visitors. Deliberately escapes the
 * `.sd-frame` phone canvas (the route declares `data: { chrome: false }`)
 * so the marketing layout can run edge-to-edge up to 1120px.
 *
 * The top nav is `position: sticky` so the primary conversion stays
 * in reach down a long marketing page. A 1px sentinel above the nav
 * is observed with `IntersectionObserver`; once scrolled past, the
 * nav gains an `.is-scrolled` class and cross-fades to a glass bar
 * (mirrors Stripe/Linear; avoids a heavy chrome at scrollY=0).
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [RouterLink, Button, Chip, Icon, TimelineBlock],
  templateUrl: './splash.page.html',
  styleUrl: './splash.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashPage implements AfterViewInit, OnDestroy {
  private readonly nav = viewChild.required<ElementRef<HTMLElement>>('nav');
  private readonly sentinel = viewChild.required<ElementRef<HTMLElement>>('sentinel');
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    const navEl = this.nav().nativeElement;
    const sentinelEl = this.sentinel().nativeElement;
    this.observer = new IntersectionObserver(
      ([entry]) => navEl.classList.toggle('is-scrolled', !entry.isIntersecting),
      { rootMargin: '-32px 0px 0px 0px', threshold: 0 },
    );
    this.observer.observe(sentinelEl);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
