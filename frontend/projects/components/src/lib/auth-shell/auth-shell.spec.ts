import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthShell } from './auth-shell';

@Component({
  standalone: true,
  imports: [AuthShell],
  template: `<sd-auth-shell stack><section class="card-a">Sign in</section></sd-auth-shell>`,
})
class HostCmp {}

describe('AuthShell', () => {
  let fixture: ComponentFixture<AuthShell>;
  let host: HTMLElement;

  const footLinks = (): HTMLAnchorElement[] =>
    Array.from(host.querySelectorAll('p.auth__foot a.sd-link--soft'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthShell, HostCmp],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AuthShell);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates the centred column with the brand lockup', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('auth')).toBe(true);
    const brand = host.querySelector('.auth__col a.auth__brand') as HTMLAnchorElement;
    expect(brand.getAttribute('href')).toBe('/');
    expect(brand.textContent?.trim()).toBe('Saturdaze');
    expect(brand.querySelector('.brand-mark')?.getAttribute('aria-hidden')).toBe('true');
    expect(host.classList.contains('auth--stack')).toBe(false);
    expect(host.getAttribute('stack')).toBeNull();
  });

  it('links Terms, Privacy and Back in the footer', () => {
    expect(footLinks().map((a) => a.textContent?.trim())).toEqual([
      'Terms',
      'Privacy',
      'Back to Saturdaze',
    ]);
    expect(footLinks().map((a) => a.getAttribute('href'))).toEqual([
      '/legal',
      '/legal#privacy',
      '/',
    ]);
    const dots = host.querySelectorAll('.auth__foot span[aria-hidden="true"]');
    expect(dots.length).toBe(2);
  });

  it('top-aligns stacked cards', () => {
    fixture.componentRef.setInput('stack', true);
    fixture.detectChanges();
    expect(host.classList.contains('auth--stack')).toBe(true);
    expect(host.getAttribute('stack')).toBe('');
  });

  it('projects the card between the brand and the footer', () => {
    const wrapper = TestBed.createComponent(HostCmp);
    wrapper.detectChanges();
    const el = (wrapper.nativeElement as HTMLElement).querySelector('sd-auth-shell') as HTMLElement;
    const col = el.querySelector('.auth__col') as HTMLElement;
    const kids = Array.from(col.children);
    expect(kids[0]?.classList.contains('auth__brand')).toBe(true);
    expect(kids[1]?.classList.contains('card-a')).toBe(true);
    expect(kids[kids.length - 1]?.classList.contains('auth__foot')).toBe(true);
    expect(el.classList.contains('auth--stack')).toBe(true);
  });
});
