import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Chip } from './chip';

@Component({
  standalone: true,
  imports: [Chip],
  template: `<sd-chip tone="sun"><i class="glyph"></i>Sunny</sd-chip>`,
})
class HostCmp {}

describe('Chip', () => {
  let fixture: ComponentFixture<Chip>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Chip, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(Chip);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates as a plain .chip with no modifiers', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('chip')).toBe(true);
    expect(host.className.trim()).toBe('chip');
    expect(host.getAttribute('tone')).toBeNull();
    expect(host.getAttribute('size')).toBeNull();
    expect(host.getAttribute('removable')).toBeNull();
    expect(host.querySelector('.chip__x')).toBeNull();
  });

  it('mirrors the tone to a host class and attribute', () => {
    for (const tone of ['sun', 'sky', 'leaf', 'indoor', 'accent', 'primary', 'warn', 'ink']) {
      fixture.componentRef.setInput('tone', tone);
      fixture.detectChanges();
      expect(host.classList.contains(`chip--${tone}`)).toBe(true);
      expect(host.getAttribute('tone')).toBe(tone);
    }
    fixture.componentRef.setInput('tone', 'default');
    fixture.detectChanges();
    expect(host.classList.contains('chip--ink')).toBe(false);
    expect(host.getAttribute('tone')).toBeNull();
  });

  it('mirrors the small size and the count badge', () => {
    fixture.componentRef.setInput('size', 'sm');
    fixture.componentRef.setInput('count', true);
    fixture.detectChanges();
    expect(host.classList.contains('chip--sm')).toBe(true);
    expect(host.classList.contains('chip--count')).toBe(true);
    expect(host.getAttribute('size')).toBe('sm');
  });

  it('renders the remove button with its accessible name when removable', () => {
    fixture.componentRef.setInput('removable', true);
    fixture.detectChanges();
    const x = host.querySelector('button.chip__x') as HTMLButtonElement;
    expect(x).not.toBeNull();
    expect(x.getAttribute('type')).toBe('button');
    expect(x.getAttribute('aria-label')).toBe('Remove');
    expect(x.querySelector('sd-icon')?.getAttribute('name')).toBe('close');
    expect(host.getAttribute('removable')).toBe('');

    fixture.componentRef.setInput('removeLabel', 'Remove Parks');
    fixture.detectChanges();
    expect(x.getAttribute('aria-label')).toBe('Remove Parks');
  });

  it('emits remove when the × is pressed', () => {
    fixture.componentRef.setInput('removable', true);
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentInstance.remove.subscribe(spy);
    (host.querySelector('.chip__x') as HTMLElement).click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('projects its content ahead of the remove button', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const chip = (wrapper.nativeElement as HTMLElement).querySelector('sd-chip') as HTMLElement;
    expect(chip.classList.contains('chip--sun')).toBe(true);
    expect(chip.firstElementChild?.classList.contains('glyph')).toBe(true);
    expect(chip.textContent?.trim()).toBe('Sunny');
  });
});
