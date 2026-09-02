import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BottomNav } from './bottom-nav';

describe('BottomNav', () => {
  let fixture: ComponentFixture<BottomNav>;
  let host: HTMLElement;

  const items = (): HTMLAnchorElement[] => Array.from(host.querySelectorAll('a.bottom-nav__item'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomNav],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BottomNav);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates the primary navigation landmark', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('bottom-nav')).toBe(true);
    expect(host.getAttribute('role')).toBe('navigation');
    expect(host.getAttribute('aria-label')).toBe('Primary');
    expect(host.getAttribute('active')).toBeNull();
  });

  it('renders exactly four items in the fixed order', () => {
    expect(items().length).toBe(4);
    expect(items().map((a) => a.getAttribute('data-nav'))).toEqual([
      'weekend',
      'ideas',
      'past',
      'family',
    ]);
    expect(items().map((a) => a.textContent?.trim())).toEqual([
      'Weekend',
      'Ideas',
      'Past',
      'Family',
    ]);
    expect(items().map((a) => a.getAttribute('href'))).toEqual([
      '/weekend',
      '/ideas',
      '/past',
      '/family',
    ]);
  });

  it('draws each item glyph at 22px', () => {
    const icons = items().map((a) => a.querySelector('.bottom-nav__icon sd-icon') as HTMLElement);
    expect(icons.map((i) => i.getAttribute('name'))).toEqual(['home', 'sparkle', 'star', 'user']);
    expect(icons.every((i) => i.getAttribute('size') === '22')).toBe(true);
  });

  it('marks the active destination with aria-current', () => {
    expect(host.querySelector('[aria-current]')).toBeNull();

    fixture.componentRef.setInput('active', 'ideas');
    fixture.detectChanges();
    expect(host.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('Ideas');
    expect(host.querySelectorAll('[aria-current="page"]').length).toBe(1);
    expect(host.getAttribute('active')).toBe('ideas');

    fixture.componentRef.setInput('active', null);
    fixture.detectChanges();
    expect(host.querySelector('[aria-current]')).toBeNull();
    expect(host.getAttribute('active')).toBeNull();
  });
});
