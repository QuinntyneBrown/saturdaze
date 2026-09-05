import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';

import { ChipInput } from './chip-input';

describe('ChipInput', () => {
  let fixture: ComponentFixture<ChipInput>;
  let component: ChipInput;
  let host: HTMLElement;
  let onChange: Mock<(value: string[]) => void>;

  const field = (): HTMLInputElement =>
    host.querySelector('input.chip-input__field') as HTMLInputElement;
  const chips = (): HTMLElement[] => Array.from(host.querySelectorAll('sd-chip'));
  const chipText = (): string[] => chips().map((c) => c.textContent?.trim() ?? '');

  // A change-detection pass follows every input event, as it would between
  // two real key presses, so the `[value]` binding tracks the draft.
  function type(text: string): void {
    field().value = text;
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function key(k: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key: k, cancelable: true, bubbles: true });
    field().dispatchEvent(event);
    return event;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChipInput] }).compileComponents();
    fixture = TestBed.createComponent(ChipInput);
    component = fixture.componentInstance;
    onChange = vi.fn<(value: string[]) => void>();
    component.registerOnChange(onChange);
    component.writeValue(['Parks', 'Pizza']);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a leaf-toned field with the written values as removable chips', () => {
    expect(component).toBeTruthy();
    expect(host.classList.contains('field')).toBe(true);
    expect(host.getAttribute('tone')).toBe('leaf');
    expect(chipText()).toEqual(['Parks', 'Pizza']);
    expect(chips().every((c) => c.hasAttribute('removable'))).toBe(true);
    expect(chips().every((c) => c.getAttribute('tone') === 'leaf')).toBe(true);
    expect(chips()[0]?.querySelector('.chip__x')?.getAttribute('aria-label')).toBe('Remove Parks');
    expect(field().getAttribute('placeholder')).toBe('Add one, press Enter');
    expect(field().value).toBe('');
  });

  it('links the label to the bare input and forwards tone and placeholder', () => {
    fixture.componentRef.setInput('label', 'Likes');
    fixture.componentRef.setInput('tone', 'warn');
    fixture.componentRef.setInput('placeholder', 'Add a dislike');
    fixture.detectChanges();
    const label = host.querySelector('label.field__label') as HTMLLabelElement;
    expect(label.textContent?.trim()).toBe('Likes');
    expect(label.getAttribute('for')).toBe(field().id);
    expect(field().id).toMatch(/^sd-chip-input-\d+$/);
    expect(host.getAttribute('label')).toBe('Likes');
    expect(host.getAttribute('tone')).toBe('warn');
    expect(chips()[0]?.getAttribute('tone')).toBe('warn');
    expect(field().getAttribute('placeholder')).toBe('Add a dislike');
  });

  it('adds the draft on Enter, clears the input and swallows the key', () => {
    type('Lego');
    const event = key('Enter');
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(true);
    expect(chipText()).toEqual(['Parks', 'Pizza', 'Lego']);
    expect(onChange).toHaveBeenLastCalledWith(['Parks', 'Pizza', 'Lego']);
    expect(field().value).toBe('');
  });

  it('adds on comma and on blur, trimming whitespace', () => {
    type('  Bikes ');
    key(',');
    fixture.detectChanges();
    expect(chipText()).toEqual(['Parks', 'Pizza', 'Bikes']);

    type('Museum');
    field().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(chipText()).toEqual(['Parks', 'Pizza', 'Bikes', 'Museum']);
    expect(onChange).toHaveBeenLastCalledWith(['Parks', 'Pizza', 'Bikes', 'Museum']);
  });

  it('ignores blanks and case-insensitive duplicates', () => {
    type('   ');
    key('Enter');
    type('pizza');
    key('Enter');
    fixture.detectChanges();
    expect(chipText()).toEqual(['Parks', 'Pizza']);
    expect(onChange).not.toHaveBeenCalled();
    expect(field().value).toBe('');
  });

  it('removes the last value on Backspace when the draft is empty', () => {
    key('Backspace');
    fixture.detectChanges();
    expect(chipText()).toEqual(['Parks']);
    expect(onChange).toHaveBeenLastCalledWith(['Parks']);

    type('P');
    key('Backspace');
    fixture.detectChanges();
    expect(chipText()).toEqual(['Parks']);
  });

  it('removes a value when its chip × is pressed', () => {
    (chips()[0]?.querySelector('.chip__x') as HTMLElement).click();
    fixture.detectChanges();
    expect(chipText()).toEqual(['Pizza']);
    expect(onChange).toHaveBeenLastCalledWith(['Pizza']);
  });

  it('disables the input and ignores removals from the form', () => {
    component.setDisabledState(true);
    fixture.detectChanges();
    expect(field().disabled).toBe(true);
    (chips()[0]?.querySelector('.chip__x') as HTMLElement).click();
    fixture.detectChanges();
    expect(chipText()).toEqual(['Parks', 'Pizza']);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('replaces the values on a later writeValue and clears on null', () => {
    component.writeValue(['Beach']);
    fixture.detectChanges();
    expect(chipText()).toEqual(['Beach']);
    component.writeValue(null);
    fixture.detectChanges();
    expect(chips().length).toBe(0);
  });
});
