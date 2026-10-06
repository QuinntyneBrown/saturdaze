import { DOCUMENT } from '@angular/common';
import {
  ComponentRef,
  Directive,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
} from '@angular/core';
import { ConnectedPosition, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

import { TooltipPanel } from './tooltip-panel';

/**
 * A short hint for a control, shown on hover and keyboard focus. Mirrors
 * the Fluent UI v9 Tooltip: a CDK Overlay anchored to the trigger, never
 * on touch, dismissed by Escape, blur, pointer-out or a press.
 *
 * `relationship` says what the text is to assistive tech. `label` (an
 * icon-only button) leaves the name on the trigger's `aria-label` and hides
 * the bubble from the accessibility tree so nothing is read twice;
 * `description` points `aria-describedby` at the bubble while it shows.
 */

export type TooltipPlacement = 'top' | 'bottom';
export type TooltipRelationship = 'label' | 'description';

/** Hover delay before the first tooltip; later ones in a row show at once. */
const SHOW_DELAY_MS = 400;
/** Grace period to move the pointer onto the bubble (WCAG 1.4.13 hoverable). */
const HIDE_DELAY_MS = 100;
/** A tooltip shown within this long after another hid skips the delay. */
const WARM_MS = 600;

const POSITIONS: Record<TooltipPlacement, ConnectedPosition[]> = {
  top: [
    { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -6 },
    { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 6 },
  ],
  bottom: [
    { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 6 },
    { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -6 },
  ],
};

let nextId = 0;
let lastHiddenAt = 0;

@Directive({
  selector: '[sdTooltip]',
  standalone: true,
  exportAs: 'sdTooltip',
  host: {
    '(pointerenter)': 'onPointerEnter($event)',
    '(pointerleave)': 'scheduleHide()',
    '(pointerdown)': 'hide()',
    '(focusin)': 'onFocus()',
    '(focusout)': 'hide()',
  },
})
export class Tooltip implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  readonly text = input<string>('', { alias: 'sdTooltip' });
  readonly placement = input<TooltipPlacement>('top', { alias: 'sdTooltipPlacement' });
  readonly relationship = input<TooltipRelationship>('description', {
    alias: 'sdTooltipRelationship',
  });

  private readonly id = `sd-tooltip-${++nextId}`;
  private overlayRef: OverlayRef | null = null;
  private panel: ComponentRef<TooltipPanel> | null = null;
  private showTimer: ReturnType<typeof setTimeout> | undefined;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Keep an open bubble in step with its trigger (Lock ↔ Unlock).
    effect(() => {
      const text = this.text();
      if (!this.panel) return;
      if (!text) this.hide();
      else {
        this.panel.setInput('text', text);
        this.panel.changeDetectorRef.detectChanges();
      }
    });
  }

  /** True while the bubble is in the DOM. */
  get visible(): boolean {
    return !!this.overlayRef?.hasAttached();
  }

  protected onPointerEnter(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    clearTimeout(this.hideTimer);
    if (this.visible) return;
    clearTimeout(this.showTimer);
    if (Date.now() - lastHiddenAt < WARM_MS) this.show();
    else this.showTimer = setTimeout(() => this.show(), SHOW_DELAY_MS);
  }

  protected onFocus(): void {
    // Keyboard focus only — a mouse click focuses the button too.
    if (matchesFocusVisible(this.host.nativeElement)) this.show();
  }

  show(): void {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
    const text = this.text();
    if (!text || this.visible || isDisabled(this.host.nativeElement)) return;

    this.overlayRef ??= this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.host)
        .withPositions(POSITIONS[this.placement()])
        .withFlexibleDimensions(false)
        .withViewportMargin(8),
      scrollStrategy: this.overlay.scrollStrategies.close(),
      panelClass: 'sd-tooltip-pane',
    });

    this.panel = this.overlayRef.attach(new ComponentPortal(TooltipPanel));
    this.panel.setInput('text', text);
    this.panel.setInput('tooltipId', this.id);
    this.panel.setInput('hidden', this.relationship() === 'label');
    // Render now so the description exists before a screen reader reads focus.
    this.panel.changeDetectorRef.detectChanges();
    const el = this.panel.location.nativeElement as HTMLElement;
    el.addEventListener('pointerenter', () => clearTimeout(this.hideTimer));
    el.addEventListener('pointerleave', () => this.scheduleHide());
    this.document.addEventListener('keydown', this.onKeydown, true);
    if (this.relationship() === 'description') this.setDescribedBy(true);
  }

  hide(): void {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
    if (!this.visible) return;
    this.overlayRef?.detach();
    this.panel = null;
    lastHiddenAt = Date.now();
    this.document.removeEventListener('keydown', this.onKeydown, true);
    this.setDescribedBy(false);
  }

  protected scheduleHide(): void {
    clearTimeout(this.showTimer);
    if (!this.visible) return;
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.hide(), HIDE_DELAY_MS);
  }

  ngOnDestroy(): void {
    this.hide();
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }

  private readonly onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    // Dismiss the hint only; don't let the same Escape close a dialog too.
    event.stopPropagation();
    this.hide();
  };

  /** Adds or removes our id, keeping any descriptions the trigger already has. */
  private setDescribedBy(on: boolean): void {
    const el = this.host.nativeElement;
    const ids = (el.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((t) => t && t !== this.id);
    if (on) ids.push(this.id);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
    else el.removeAttribute('aria-describedby');
  }
}

function matchesFocusVisible(el: HTMLElement): boolean {
  try {
    return el.matches(':focus-visible');
  } catch {
    return true; // engines without :focus-visible — err on showing the hint
  }
}

function isDisabled(el: HTMLElement): boolean {
  return (el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true';
}
