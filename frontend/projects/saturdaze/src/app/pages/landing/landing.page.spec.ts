import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LANDING_SAMPLE } from './landing-sample';
import { LandingPage } from './landing.page';

describe('LandingPage', () => {
  let fixture: ComponentFixture<LandingPage>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('opens with the hero copy and one CTA to create an account', () => {
    const title = host.querySelector('#hero-title');
    expect(title?.textContent).toContain('Two days.');
    expect(title?.textContent).toContain('Already planned.');
    expect(title?.querySelector('br')).not.toBeNull();
    expect(host.querySelector('.hero__eyebrow')?.textContent?.trim()).toBe(
      'Weekends, drafted for your family',
    );
    const cta = host.querySelector('.hero__cta sd-button a');
    expect(cta?.getAttribute('href')).toBe('/create-account');
    // The CTA label is not asserted: sd-button drops the default text of its
    // <a> branch (see the TODO in components/button.spec.ts).
    expect(host.querySelector('.hero__note')?.textContent?.trim()).toBe('Free during the beta.');
    expect(host.querySelector('.hero__alt a')?.getAttribute('href')).toBe('/sign-in');
  });

  it('draws the sample weekend with real day and block components inside a browser frame', () => {
    expect(host.querySelector('sd-browser-frame')).not.toBeNull();
    const days = Array.from(host.querySelectorAll('sd-day'));
    expect(days.map((d) => d.querySelector('.day__title')?.textContent?.trim())).toEqual([
      'Saturday',
      'Sunday',
    ]);
    // sun draws the sun-toned weather disc; cloud the sky-toned one.
    const discTone = (day: Element): string | null =>
      ['sun', 'sky'].find((t) =>
        day.querySelector('.weather-disc')?.classList.contains(`disc--${t}`),
      ) ?? null;
    expect(days.map(discTone)).toEqual(['sun', 'sky']);
    const blocks = Array.from(host.querySelectorAll('sd-block'));
    expect(blocks.length).toBe(LANDING_SAMPLE.reduce((n, d) => n + d.blocks.length, 0));
    expect(blocks[0]?.classList.contains('block--commitment')).toBe(true);
    expect(blocks[1]?.classList.contains('block--drive')).toBe(true);
    expect(host.querySelectorAll('sd-block .block__chev').length).toBe(0);
    expect(host.querySelectorAll('sd-day .day__actions').length).toBe(0);
  });

  it('explains how a weekend comes together in three steps', () => {
    expect(host.querySelector('#how-title')?.textContent?.trim()).toBe(
      'How a weekend comes together',
    );
    const steps = Array.from(host.querySelectorAll('.step'));
    expect(steps.map((s) => s.querySelector('.step__num')?.textContent?.trim())).toEqual([
      '01',
      '02',
      '03',
    ]);
    expect(steps.map((s) => s.querySelector('.step__title')?.textContent?.trim())).toEqual([
      'Tell us who is in the family',
      'Lock what does not move',
      'Get a weekend every Friday',
    ]);
  });

  it('closes with the site footer links', () => {
    const links = Array.from(host.querySelectorAll('footer.site-footer a'));
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Terms', 'Privacy', 'Sign in']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/legal',
      '/legal#privacy',
      '/sign-in',
    ]);
  });
});
