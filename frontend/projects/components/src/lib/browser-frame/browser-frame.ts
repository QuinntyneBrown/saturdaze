import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * A small browser window that scales a fixed-width composition to fit its
 * container (the landing hero's live miniature of the Weekend screen).
 * Mirrors `.browser-frame` in docs/mocks-v2/styles/app.css. Project the
 * composition; it is laid out at `frameWidth` × `frameHeight` and scaled
 * down with a ResizeObserver. Decorative: the host is `aria-hidden`.
 */
@Component({
  selector: 'sd-browser-frame',
  standalone: true,
  templateUrl: './browser-frame.html',
  styleUrl: './browser-frame.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'browser-frame',
    'aria-hidden': 'true',
    '[attr.url]': 'url()',
    '[style.--_s]': 'scale()',
    '[style.--_w.px]': 'frameWidth()',
    '[style.--_h.px]': 'frameHeight()',
  },
})
export class BrowserFrame {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly url = input<string>('saturdaze.app/weekend');
  readonly frameWidth = input<number>(720);
  readonly frameHeight = input<number>(300);

  private readonly hostWidth = signal(0);
  protected readonly scale = computed(() => {
    const w = this.hostWidth();
    return w > 0 ? Math.min(1, w / this.frameWidth()) : 1;
  });

  constructor() {
    afterNextRender(() => {
      const el = this.host.nativeElement;
      this.hostWidth.set(el.clientWidth);
      if (typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? el.clientWidth;
        this.hostWidth.set(width);
      });
      ro.observe(el);
      this.destroyRef.onDestroy(() => ro.disconnect());
    });
  }
}
