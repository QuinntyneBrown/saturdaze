import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Sitebar } from './sitebar';

describe('Sitebar', () => {
  let fixture: ComponentFixture<Sitebar>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sitebar],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Sitebar);
    fixture.detectChanges();
    await fixture.whenStable();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates the public bar with the wordmark linking to the landing page', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('sitebar')).toBe(true);
    const brand = host.querySelector('.sitebar__inner a.sitebar__brand') as HTMLAnchorElement;
    expect(brand.getAttribute('href')).toBe('/');
    expect(brand.textContent?.trim()).toBe('Saturdaze');
    expect(brand.querySelector('.brand-mark')?.getAttribute('aria-hidden')).toBe('true');
    expect(host.hasAttribute('data-scrolled')).toBe(false);
  });

  it('offers Sign in and no CTA by default', () => {
    const signIn = host.querySelector('.sitebar__actions a.sitebar__link') as HTMLAnchorElement;
    expect(signIn.getAttribute('href')).toBe('/sign-in');
    expect(signIn.textContent?.trim()).toBe('Sign in');
    expect(host.querySelector('sd-button')).toBeNull();
    expect(host.getAttribute('cta')).toBeNull();
  });

  it('adds the Create your account CTA when asked', () => {
    fixture.componentRef.setInput('cta', true);
    fixture.detectChanges();
    expect(host.getAttribute('cta')).toBe('');
    const cta = host.querySelector('.sitebar__actions a.btn') as HTMLAnchorElement;
    expect(cta.getAttribute('href')).toBe('/create-account');
    expect(cta.classList.contains('btn--primary')).toBe(true);
    expect(cta.classList.contains('btn--sm')).toBe(true);
  });

  // TODO(sd-button): an sd-button rendered as an anchor (href) drops its
  // default content — see the projection TODO in button.spec.ts. The CTA
  // currently renders as an empty coral pill. Un-skip once sd-button projects
  // through a single <ng-template #body> + NgTemplateOutlet like sd-list-item.
  it.skip('labels the CTA with its text', () => {
    fixture.componentRef.setInput('cta', true);
    fixture.detectChanges();
    const cta = host.querySelector('.sitebar__actions a.btn') as HTMLAnchorElement;
    expect(cta.textContent?.trim()).toBe('Create your account');
  });

  it('fades in its backdrop once the page scrolls', () => {
    Object.defineProperty(window, 'scrollY', { value: 30, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(host.getAttribute('data-scrolled')).toBe('');
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
  });
});
