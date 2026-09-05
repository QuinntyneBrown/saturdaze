import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TopBar } from './top-bar';

describe('TopBar', () => {
  let fixture: ComponentFixture<TopBar>;
  let host: HTMLElement;

  const links = (): HTMLAnchorElement[] =>
    Array.from(host.querySelectorAll('nav.topbar__nav a.topbar__link'));
  const accountBtn = (): HTMLButtonElement =>
    host.querySelector('button.avatar-btn') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopBar],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(TopBar);
    fixture.detectChanges();
    await fixture.whenStable();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates the bar with the wordmark linking home', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('topbar')).toBe(true);
    const brand = host.querySelector('.topbar__inner a.topbar__brand') as HTMLAnchorElement;
    expect(brand.getAttribute('href')).toBe('/weekend');
    expect(brand.textContent?.trim()).toBe('Saturdaze');
    expect(brand.querySelector('.brand-mark')?.getAttribute('aria-hidden')).toBe('true');
    expect(host.hasAttribute('data-scrolled')).toBe(false);
  });

  it('renders the four primary links in order', () => {
    expect(host.querySelector('nav.topbar__nav')?.getAttribute('aria-label')).toBe('Primary');
    expect(links().map((a) => a.getAttribute('data-nav'))).toEqual([
      'weekend',
      'ideas',
      'past',
      'family',
    ]);
    expect(links().map((a) => a.textContent?.trim())).toEqual([
      'Weekend',
      'Ideas',
      'Past',
      'Family',
    ]);
    expect(links().map((a) => a.getAttribute('href'))).toEqual([
      '/weekend',
      '/ideas',
      '/past',
      '/family',
    ]);
    expect(host.querySelector('[aria-current]')).toBeNull();
    expect(host.getAttribute('active')).toBeNull();
  });

  it('marks the active destination with aria-current', () => {
    fixture.componentRef.setInput('active', 'past');
    fixture.detectChanges();
    expect(host.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('Past');
    expect(host.querySelectorAll('[aria-current="page"]').length).toBe(1);
    expect(host.querySelector('.topbar__link[data-nav="past"]')?.getAttribute('aria-current')).toBe(
      'page',
    );
    expect(host.getAttribute('active')).toBe('past');
  });

  it('shows the account initial from the email', () => {
    const avatar = host.querySelector('.topbar__actions sd-avatar') as HTMLElement;
    expect(avatar.textContent?.trim()).toBe('?');
    expect(avatar.getAttribute('tone')).toBe('primary');

    fixture.componentRef.setInput('email', 'quinn@example.com');
    fixture.detectChanges();
    expect(avatar.textContent?.trim()).toBe('Q');
  });

  it('emits the avatar button so the account menu can anchor to it', () => {
    expect(accountBtn().getAttribute('aria-label')).toBe('Account menu');
    expect(accountBtn().getAttribute('type')).toBe('button');
    const spy = vi.fn();
    fixture.componentInstance.accountClick.subscribe(spy);
    accountBtn().click();
    expect(spy).toHaveBeenCalledWith(accountBtn());
  });

  it('fades in its backdrop once the page scrolls', () => {
    Object.defineProperty(window, 'scrollY', { value: 30, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(host.getAttribute('data-scrolled')).toBe('');
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
  });
});
