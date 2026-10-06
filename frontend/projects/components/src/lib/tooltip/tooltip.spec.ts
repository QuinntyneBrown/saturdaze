import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tooltip, TooltipRelationship } from './tooltip';

@Component({
  standalone: true,
  imports: [Tooltip],
  template: `
    <button
      id="trigger"
      type="button"
      [sdTooltip]="text()"
      [sdTooltipRelationship]="relationship()"
      aria-describedby="hint"
    >
      Go
    </button>
  `,
})
class HostCmp {
  readonly text = signal('Swap for something else');
  readonly relationship = signal<TooltipRelationship>('description');
}

/** jsdom has no PointerEvent constructor; a MouseEvent carrying pointerType will do. */
function pointer(el: Element, type: string, pointerType = 'mouse'): void {
  const event = new MouseEvent(type);
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  el.dispatchEvent(event);
}

/** Focus as the keyboard would, so `:focus-visible` matches (it keys off the last input event). */
function tabTo(el: HTMLElement): void {
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  el.focus();
}

describe('Tooltip', () => {
  let fixture: ComponentFixture<HostCmp>;
  let trigger: HTMLButtonElement;

  const bubble = (): HTMLElement | null => document.querySelector('.tooltip');

  beforeEach(async () => {
    vi.useFakeTimers();
    // Step past the "warm" window left by the previous test's hide.
    vi.setSystemTime(Date.now() + 10_000);
    await TestBed.configureTestingModule({ imports: [HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    trigger = fixture.nativeElement.querySelector('#trigger');
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('shows after a hover delay and hides on pointer-out', () => {
    pointer(trigger, 'pointerenter');
    expect(bubble()).toBeNull();
    vi.advanceTimersByTime(400);
    expect(bubble()?.textContent?.trim()).toBe('Swap for something else');
    expect(bubble()?.getAttribute('role')).toBe('tooltip');

    pointer(trigger, 'pointerleave');
    vi.advanceTimersByTime(100);
    expect(bubble()).toBeNull();
  });

  it('stays open while the pointer moves onto the bubble', () => {
    pointer(trigger, 'pointerenter');
    vi.advanceTimersByTime(400);
    pointer(trigger, 'pointerleave');
    pointer(bubble()!, 'pointerenter');
    vi.advanceTimersByTime(500);
    expect(bubble()).not.toBeNull();
    pointer(bubble()!, 'pointerleave');
    vi.advanceTimersByTime(100);
    expect(bubble()).toBeNull();
  });

  it('skips the delay for the next tooltip right after one hides', () => {
    pointer(trigger, 'pointerenter');
    vi.advanceTimersByTime(400);
    pointer(trigger, 'pointerleave');
    vi.advanceTimersByTime(100);
    pointer(trigger, 'pointerenter');
    expect(bubble()).not.toBeNull();
  });

  it('never shows for touch', () => {
    pointer(trigger, 'pointerenter', 'touch');
    vi.advanceTimersByTime(1000);
    expect(bubble()).toBeNull();
  });

  it('shows at once on keyboard focus and hides on blur', () => {
    tabTo(trigger);
    expect(bubble()).not.toBeNull();
    trigger.blur();
    expect(bubble()).toBeNull();
  });

  it('dismisses on Escape and on press', () => {
    tabTo(trigger);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(bubble()).toBeNull();

    trigger.blur();
    tabTo(trigger);
    pointer(trigger, 'pointerdown');
    expect(bubble()).toBeNull();
  });

  it('adds itself to aria-describedby while shown, keeping existing ids', () => {
    tabTo(trigger);
    const id = bubble()!.id;
    expect(trigger.getAttribute('aria-describedby')).toBe(`hint ${id}`);
    expect(bubble()!.hasAttribute('aria-hidden')).toBe(false);
    trigger.blur();
    expect(trigger.getAttribute('aria-describedby')).toBe('hint');
  });

  it('as a label, hides the bubble from assistive tech and leaves aria-describedby alone', () => {
    fixture.componentInstance.relationship.set('label');
    fixture.detectChanges();
    tabTo(trigger);
    expect(bubble()!.getAttribute('aria-hidden')).toBe('true');
    expect(trigger.getAttribute('aria-describedby')).toBe('hint');
  });

  it('follows text changes while open and closes when the text clears', () => {
    tabTo(trigger);
    fixture.componentInstance.text.set('Unlock');
    fixture.detectChanges();
    expect(bubble()?.textContent?.trim()).toBe('Unlock');

    fixture.componentInstance.text.set('');
    fixture.detectChanges();
    expect(bubble()).toBeNull();
  });

  it('does nothing without text', () => {
    fixture.componentInstance.text.set('');
    fixture.detectChanges();
    tabTo(trigger);
    expect(bubble()).toBeNull();
  });
});
