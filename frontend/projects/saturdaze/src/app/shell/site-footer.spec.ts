import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  let fixture: ComponentFixture<SiteFooter>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteFooter],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SiteFooter);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders a <footer> so the shell can place it as the contentinfo landmark', () => {
    expect(host.querySelector('footer.site-footer')).not.toBeNull();
  });

  it('closes with the Terms, Privacy and Sign in links', () => {
    const links = Array.from(host.querySelectorAll('footer a'));
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Terms', 'Privacy', 'Sign in']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/legal',
      '/legal#privacy',
      '/sign-in',
    ]);
  });
});
