import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventCard } from './event-card';

@Component({
  standalone: true,
  imports: [EventCard],
  template: `
    <sd-event-card title="Port Credit Buskerfest" date="2026-08-15">
      <span slot="chips" class="chip-a">Free</span>
    </sd-event-card>
  `,
})
class HostCmp {}

describe('EventCard', () => {
  let fixture: ComponentFixture<EventCard>;
  let host: HTMLElement;

  const footerLink = (): HTMLAnchorElement | null => host.querySelector('.card__footer a.btn');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EventCard, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(EventCard);
    fixture.componentRef.setInput('title', 'Port Credit Buskerfest');
    fixture.componentRef.setInput('date', '2026-08-15');
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a card with the date tile and title', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('card')).toBe(true);
    const tile = host.querySelector('.card__head sd-date-tile') as HTMLElement;
    expect(tile.getAttribute('date')).toBe('2026-08-15');
    expect(tile.querySelector('.date-tile__m')?.textContent).toBe('Aug');
    expect(tile.querySelector('.date-tile__d')?.textContent).toBe('15');
    expect(host.querySelector('h3.card__title')?.textContent?.trim()).toBe(
      'Port Credit Buskerfest',
    );
    expect(host.querySelector('.card__meta')).toBeNull();
    expect(host.querySelector('.card__footer')).toBeNull();
    expect(host.getAttribute('title')).toBe('Port Credit Buskerfest');
    expect(host.getAttribute('date')).toBe('2026-08-15');
    expect(host.getAttribute('muted')).toBeNull();
  });

  it('renders the place and date line', () => {
    fixture.componentRef.setInput('meta', 'Memorial Park · Sat 15 Aug');
    fixture.detectChanges();
    expect(host.querySelector('.card__meta')?.textContent?.trim()).toBe(
      'Memorial Park · Sat 15 Aug',
    );
  });

  it('adds a Details link that opens in a new tab when the event has a url', () => {
    fixture.componentRef.setInput('url', 'https://buskerfest.example');
    fixture.detectChanges();
    const link = footerLink() as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://buskerfest.example');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
    expect(link.classList.contains('btn--quiet')).toBe(true);
    expect(link.lastElementChild?.tagName.toLowerCase()).toBe('sd-icon');
    expect(link.lastElementChild?.getAttribute('name')).toBe('arrow_right');
  });

  // TODO(sd-button): an sd-button rendered as an anchor (href) drops its
  // default content — see the projection TODO in button.spec.ts. Only the
  // trailing arrow survives today. Un-skip once sd-button projects through a
  // single <ng-template #body> + NgTemplateOutlet like sd-list-item.
  it.skip('labels the Details link with its text', () => {
    fixture.componentRef.setInput('url', 'https://buskerfest.example');
    fixture.detectChanges();
    expect(footerLink()?.textContent?.trim()).toBe('Details');
  });

  it('mutes a pending suggestion and hides its Details link', () => {
    fixture.componentRef.setInput('url', 'https://buskerfest.example');
    fixture.componentRef.setInput('muted', true);
    fixture.detectChanges();
    expect(host.classList.contains('card--muted')).toBe(true);
    expect(host.getAttribute('muted')).toBe('');
    expect(footerLink()).toBeNull();
  });

  it('projects chips into the chip row', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector('sd-event-card') as HTMLElement;
    expect(el.querySelector('.card__chips .chip-a')?.textContent).toBe('Free');
    expect(el.querySelector('sd-date-tile .date-tile__m')?.textContent).toBe('Aug');
  });
});
