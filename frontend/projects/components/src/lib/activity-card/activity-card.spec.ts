import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityCard } from './activity-card';

@Component({
  standalone: true,
  imports: [ActivityCard],
  template: `
    <sd-activity-card title="Jack Darling Park" tone="leaf">
      <span slot="chips" class="chip-a">Outdoors</span>
    </sd-activity-card>
  `,
})
class HostCmp {}

describe('ActivityCard', () => {
  let fixture: ComponentFixture<ActivityCard>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ActivityCard, HostCmp] }).compileComponents();
    fixture = TestBed.createComponent(ActivityCard);
    fixture.componentRef.setInput('title', 'Jack Darling Park');
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a photo-led card whose fallback tile is leaf-toned with a tree, and the title', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('card')).toBe(true);
    expect(host.classList.contains('card--media')).toBe(true);
    const tile = host.querySelector('sd-media.card__media') as HTMLElement;
    expect(tile.classList).toContain('media--fallback');
    expect(tile.classList).toContain('media--leaf');
    expect(tile.getAttribute('aria-hidden')).toBe('true');
    expect(tile.querySelector('sd-icon')?.getAttribute('name')).toBe('tree');
    expect(host.querySelector('.card__head-text h3.card__title')?.textContent?.trim()).toBe(
      'Jack Darling Park',
    );
    expect(host.querySelector('.card__meta')).toBeNull();
    expect(host.querySelector('.card__body')).toBeNull();
    expect(host.querySelector('.card__footer')).toBeNull();
    expect(host.getAttribute('title')).toBe('Jack Darling Park');
    expect(host.getAttribute('tone')).toBe('leaf');
  });

  it('renders the place line and the why', () => {
    fixture.componentRef.setInput('meta', 'Lakeshore · 8 min drive');
    fixture.componentRef.setInput('why', 'Sunny and mild, and the kids asked for the beach.');
    fixture.detectChanges();
    expect(host.querySelector('.card__meta')?.textContent?.trim()).toBe('Lakeshore · 8 min drive');
    expect(host.querySelector('.card__body')?.textContent?.trim()).toBe(
      'Sunny and mild, and the kids asked for the beach.',
    );
  });

  it('switches to the indoor tone and a custom icon', () => {
    fixture.componentRef.setInput('tone', 'indoor');
    fixture.componentRef.setInput('icon', 'popcorn');
    fixture.detectChanges();
    const tile = host.querySelector('sd-media') as HTMLElement;
    expect(tile.querySelector('sd-icon')?.getAttribute('name')).toBe('popcorn');
    expect(tile.classList).toContain('media--indoor');
    expect(host.getAttribute('tone')).toBe('indoor');
  });

  it('adds a Map link that opens in a new tab when the catalogue has one', () => {
    fixture.componentRef.setInput('mapUrl', 'https://maps.example/jdp');
    fixture.detectChanges();
    const link = host.querySelector('.card__footer a.btn') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://maps.example/jdp');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
    expect(link.classList.contains('btn--quiet')).toBe(true);
  });
  it('labels the Map link with its glyph and text', () => {
    fixture.componentRef.setInput('mapUrl', 'https://maps.example/jdp');
    fixture.detectChanges();
    const link = host.querySelector('.card__footer a.btn') as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe('Map');
    expect(link.querySelector('sd-icon')?.getAttribute('name')).toBe('map');
  });

  it('projects chips into the chip row', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector(
      'sd-activity-card',
    ) as HTMLElement;
    expect(el.querySelector('.card__chips .chip-a')?.textContent).toBe('Outdoors');
    expect(el.querySelector('.card__title')?.textContent?.trim()).toBe('Jack Darling Park');
  });
});
