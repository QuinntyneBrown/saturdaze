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
  });

  it('mirrors the sunk variant and large padding to host classes', () => {
    fixture.componentRef.setInput('variant', 'sunk');
    fixture.componentRef.setInput('padding', 'lg');
    fixture.detectChanges();
    expect(host.classList.contains('card--sunk')).toBe(true);
    expect(host.classList.contains('card--pad-lg')).toBe(true);
  });

  it('mirrors every boolean modifier to a host class', () => {
    for (const flag of ['locked', 'dimmed', 'muted', 'span', 'interactive']) {
      fixture.componentRef.setInput(flag, true);
      fixture.detectChanges();
      expect(host.classList.contains(`card--${flag}`)).toBe(true);

      fixture.componentRef.setInput(flag, false);
      fixture.detectChanges();
      expect(host.classList.contains(`card--${flag}`)).toBe(false);
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
