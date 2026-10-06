import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterChip } from './filter-chip';

@Component({
  standalone: true,
  imports: [FilterChip],
  template: `<sd-filter-chip tone="leaf">Outdoors</sd-filter-chip>`,
})
class HostCmp {}

describe('FilterChip', () => {
  let fixture: ComponentFixture<FilterChip>;
  let host: HTMLElement;

  const button = (): HTMLButtonElement =>
    host.querySelector('button.filter-chip') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FilterChip, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(FilterChip);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates an unpressed toggle button', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(button()).not.toBeNull();
    expect(button().getAttribute('type')).toBe('button');
    expect(button().getAttribute('aria-pressed')).toBe('false');
    expect(button().disabled).toBe(false);
    expect(button().classList.contains('filter-chip--leaf')).toBe(false);
  });

  it('mirrors pressed to aria-pressed', () => {
    fixture.componentRef.setInput('pressed', true);
    fixture.detectChanges();
    expect(button().getAttribute('aria-pressed')).toBe('true');
  });

  it('mirrors the tone to the button class', () => {
    fixture.componentRef.setInput('tone', 'leaf');
    fixture.detectChanges();
    expect(button().classList.contains('filter-chip--leaf')).toBe(true);
  });

  it('emits the next pressed state on click without owning the truth', () => {
    const spy = vi.fn();
    fixture.componentInstance.pressedChange.subscribe(spy);

    button().click();
    expect(spy).toHaveBeenLastCalledWith(true);
    fixture.detectChanges();
    expect(button().getAttribute('aria-pressed')).toBe('false');

    fixture.componentRef.setInput('pressed', true);
    fixture.detectChanges();
    button().click();
    expect(spy).toHaveBeenLastCalledWith(false);
  });

  it('disables the button and swallows clicks when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.pressedChange.subscribe(spy);

    expect(button().disabled).toBe(true);
    button().click();
    expect(spy).not.toHaveBeenCalled();
  });

  it('projects the chip text inside the button', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const btn = (wrapper.nativeElement as HTMLElement).querySelector('.filter-chip') as HTMLElement;
    expect(btn.textContent?.trim()).toBe('Outdoors');
    expect(btn.classList.contains('filter-chip--leaf')).toBe(true);
  });
});
