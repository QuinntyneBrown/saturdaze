import {
  Directive,
  ElementRef,
  Renderer2,
  RendererStyleFlags2,
  effect,
  inject,
  input,
} from '@angular/core';

import { themeToCssVariables } from '../tokens/themeToCss';
import type { PartialTheme } from '../tokens/types';

/**
 * Re-themes a subtree, like Fluent's `FluentProvider`: every key of the
 * (partial) theme is written to the host as a CSS custom property, so the
 * components inside read the override through the normal cascade. The
 * whole app gets `saturdazeLightTheme` from the generated `_tokens.scss`;
 * use this only for a section that must look different.
 *
 * ```html
 * <section [sdThemeProvider]="{ colorBrandBackground: '#2d7d5f' }">…</section>
 * ```
 */
@Directive({
  selector: '[sdThemeProvider]',
  standalone: true,
})
export class ThemeProvider {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private applied: string[] = [];

  /** The tokens to override below this element. */
  readonly theme = input.required<PartialTheme>({ alias: 'sdThemeProvider' });

  constructor() {
    effect(() => {
      const el = this.host.nativeElement;
      const vars = themeToCssVariables(this.theme());
      for (const name of this.applied) {
        if (!(name in vars)) this.renderer.removeStyle(el, name, RendererStyleFlags2.DashCase);
      }
      for (const [name, value] of Object.entries(vars)) {
        this.renderer.setStyle(el, name, value, RendererStyleFlags2.DashCase);
      }
      this.applied = Object.keys(vars);
    });
  }
}
