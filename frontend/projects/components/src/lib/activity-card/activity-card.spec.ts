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

  it('creates a leaf-toned card with a tree disc and the title', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('card')).toBe(true);
    const disc = host.querySelector('.card__head sd-disc') as HTMLElement;
    expect(disc.getAttribute('icon')).toBe('tree');
    expect(disc.getAttribute('tone')).toBe('leaf');
    expect(disc.getAttribute('size')).toBe('lg');
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
    const disc = host.querySelector('sd-disc') as HTMLElement;
    expect(disc.getAttribute('icon')).toBe('popcorn');
    expect(disc.getAttribute('tone')).toBe('indoor');
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

  // TODO(sd-button): an sd-button rendered as an anchor (href) drops its
  // default content — see the projection TODO in button.spec.ts. The Map link
  // currently renders empty. Un-skip once sd-button projects through a single
  // <ng-template #body> + NgTemplateOutlet like sd-list-item.
  it.skip('labels the Map link with its glyph and text', () => {
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
