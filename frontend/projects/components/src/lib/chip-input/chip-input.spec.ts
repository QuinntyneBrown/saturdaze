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
    expect(chipText()).toEqual(['Parks', 'Pizza']);
    expect(chips().every((c) => c.querySelector('button.chip__x') !== null)).toBe(true);
    expect(chips().every((c) => c.classList.contains('chip--leaf'))).toBe(true);
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
    expect(chips().every((c) => c.classList.contains('chip--warn'))).toBe(true);
    expect(chips().some((c) => c.classList.contains('chip--leaf'))).toBe(false);
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

  it('ignores blanks', () => {
    type('   ');
    key('Enter');
    fixture.detectChanges();
    expect(chipText()).toEqual(['Parks', 'Pizza']);
    expect(onChange).not.toHaveBeenCalled();
    expect(host.querySelector('.field__error')).toBeNull();
  });

  it('refuses a case-insensitive duplicate with a message and keeps the text (L2-140)', () => {
    fixture.componentRef.setInput('label', 'Likes');
    fixture.detectChanges();
    type('pizza');
    key('Enter');
    fixture.detectChanges();
    expect(chipText()).toEqual(['Parks', 'Pizza']);
    expect(onChange).not.toHaveBeenCalled();
    expect(field().value).toBe('pizza');
    expect(field().getAttribute('aria-invalid')).toBe('true');
    const error = host.querySelector('.field__error') as HTMLElement;
    expect(error.textContent?.trim()).toBe('pizza is already in Likes.');
    expect(field().getAttribute('aria-describedby')).toBe(error.id);
    expect(error.getAttribute('role')).toBe('status');
    expect(error.getAttribute('aria-live')).toBe('polite');

    type('pizzas');
    fixture.detectChanges();
    expect(host.querySelector('.field__error')).toBeNull();
    expect(field().hasAttribute('aria-invalid')).toBe(false);
  });

  it('keeps and announces a value that conflicts with the paired list', () => {
    fixture.componentRef.setInput('label', 'Dislikes');
    fixture.componentRef.setInput('otherValues', ['Parks']);
    fixture.componentRef.setInput('otherLabel', 'Likes');
    component.writeValue(['Camping']);
    fixture.detectChanges();
    type(' Parks ');
    key('Enter');
    fixture.detectChanges();
    expect(chipText()).toEqual(['Camping']);
    expect(field().value).toBe(' Parks ');
    expect(field().getAttribute('aria-invalid')).toBe('true');
    const status = host.querySelector('[role="status"]') as HTMLElement;
    expect(status.textContent?.trim()).toBe('Parks is in Likes. Remove it there first.');
    expect(status.classList.contains('field__error')).toBe(true);
    expect(field().getAttribute('aria-describedby')).toBe(status.id);
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

  it('announces successful additions and removals', () => {
    fixture.componentRef.setInput('label', 'Likes');
    fixture.detectChanges();
    type('Zoo');
    key('Enter');
    fixture.detectChanges();
    const status = host.querySelector('[role="status"]') as HTMLElement;
    expect(status.textContent?.trim()).toBe('Zoo added to Likes.');
    (chips()[2]?.querySelector('.chip__x') as HTMLElement).click();
    fixture.detectChanges();
    expect(status.textContent?.trim()).toBe('Zoo removed.');
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
