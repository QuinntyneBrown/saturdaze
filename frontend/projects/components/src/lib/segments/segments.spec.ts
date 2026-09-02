import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { SegmentTab, Segments } from './segments';

const TABS: readonly SegmentTab[] = [
  { label: 'Activities', link: '/ideas', exact: true },
  { label: 'Food', link: ['/ideas', 'food'] },
  { label: 'Events', link: '/ideas/events' },
];

describe('Segments', () => {
  let fixture: ComponentFixture<Segments>;
  let host: HTMLElement;

  const tabs = (): HTMLAnchorElement[] => Array.from(host.querySelectorAll('a.segments__tab'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Segments],
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();
    fixture = TestBed.createComponent(Segments);
    fixture.componentRef.setInput('tabs', TABS);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a labelled navigation of real links', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('segments')).toBe(true);
    expect(host.getAttribute('role')).toBe('navigation');
    expect(host.getAttribute('aria-label')).toBe('Sections');
    expect(tabs().map((a) => a.textContent?.trim())).toEqual(['Activities', 'Food', 'Events']);
    expect(tabs().map((a) => a.getAttribute('href'))).toEqual([
      '/ideas',
      '/ideas/food',
      '/ideas/events',
    ]);
  });

  it('mirrors narrow and the label', () => {
    fixture.componentRef.setInput('narrow', true);
    fixture.componentRef.setInput('label', 'Ideas');
    fixture.detectChanges();
    expect(host.classList.contains('segments--narrow')).toBe(true);
    expect(host.getAttribute('aria-label')).toBe('Ideas');
  });

  it('appends a fragment to the link', () => {
    fixture.componentRef.setInput('tabs', [
      { label: 'Terms', link: '/legal' },
      { label: 'Privacy', link: '/legal', fragment: 'privacy' },
    ]);
    fixture.detectChanges();
    expect(tabs()[1]?.getAttribute('href')).toBe('/legal#privacy');
  });

  it('marks the explicitly active tab with aria-current', () => {
    fixture.componentRef.setInput('active', 'Food');
    fixture.detectChanges();
    expect(tabs().map((a) => a.getAttribute('aria-current'))).toEqual([null, 'page', null]);
    expect(host.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('Food');

    fixture.componentRef.setInput('active', 'Nowhere');
    fixture.detectChanges();
    expect(host.querySelector('[aria-current="page"]')).toBeNull();
  });

  it('lets the router mark the active tab when none is named', async () => {
    const router = TestBed.inject(Router);
    expect(host.querySelector('[aria-current="page"]')).toBeNull();

    await router.navigateByUrl('/ideas/food');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('Food');
    expect(tabs()[0]?.hasAttribute('aria-current')).toBe(false);

    await router.navigateByUrl('/ideas');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('Activities');
  });
});
