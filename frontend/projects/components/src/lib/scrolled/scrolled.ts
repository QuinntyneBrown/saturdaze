import { DestroyRef, Directive, NgZone, afterNextRender, inject, signal } from '@angular/core';

/**
 * Sets `data-scrolled` on its host once the window has scrolled past the
 * top. The top bar and site bar use it to fade in their backdrop. The
 * listener runs outside Angular's zone and writes a signal, so change
 * detection only happens when the state flips.
 */
@Directive({
  selector: '[sdScrolled]',
  standalone: true,
  host: {
    '[attr.data-scrolled]': 'scrolled() ? "" : null',
  },
})
export class Scrolled {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  readonly scrolled = signal(false);

  constructor() {
    afterNextRender(() => {
      const update = (): void => {
        const next = window.scrollY > 4;
        if (next !== this.scrolled()) this.zone.run(() => this.scrolled.set(next));
      };
      this.zone.runOutsideAngular(() => {
        window.addEventListener('scroll', update, { passive: true });
      });
      this.destroyRef.onDestroy(() => window.removeEventListener('scroll', update));
      update();
    });
  }
}
