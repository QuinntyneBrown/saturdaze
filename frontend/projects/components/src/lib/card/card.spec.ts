import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Card } from './card';

@Component({
  standalone: true,
  imports: [Card],
  template: `<sd-card variant="sunk" padding="lg"><h3 class="inner">Family</h3></sd-card>`,
})
class HostCmp {}

describe('Card', () => {
  let fixture: ComponentFixture<Card>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Card, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(Card);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a plain card with no modifiers', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.className.trim()).toBe('card');
    for (const attr of ['variant', 'padding', 'locked', 'dimmed', 'muted', 'span', 'interactive']) {
      expect(host.hasAttribute(attr)).toBe(false);
    }
  });

  it('mirrors the sunk variant and large padding', () => {
    fixture.componentRef.setInput('variant', 'sunk');
    fixture.componentRef.setInput('padding', 'lg');
    fixture.detectChanges();
    expect(host.classList.contains('card--sunk')).toBe(true);
    expect(host.classList.contains('card--pad-lg')).toBe(true);
    expect(host.getAttribute('variant')).toBe('sunk');
    expect(host.getAttribute('padding')).toBe('lg');
  });

  it('mirrors every boolean modifier to a class and attribute', () => {
    for (const flag of ['locked', 'dimmed', 'muted', 'span', 'interactive']) {
      fixture.componentRef.setInput(flag, true);
      fixture.detectChanges();
      expect(host.classList.contains(`card--${flag}`)).toBe(true);
      expect(host.getAttribute(flag)).toBe('');

      fixture.componentRef.setInput(flag, false);
      fixture.detectChanges();
      expect(host.classList.contains(`card--${flag}`)).toBe(false);
      expect(host.hasAttribute(flag)).toBe(false);
    }
  });

  it('projects its content directly into the surface', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const card = (wrapper.nativeElement as HTMLElement).querySelector('sd-card') as HTMLElement;
    expect(card.classList.contains('card--sunk')).toBe(true);
    expect(card.classList.contains('card--pad-lg')).toBe(true);
    expect(card.firstElementChild?.classList.contains('inner')).toBe(true);
    expect(card.textContent?.trim()).toBe('Family');
  });
});
