import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Menu, MenuItem } from './menu';

const ITEMS: readonly MenuItem[] = [
  { id: 'family', label: 'Family', icon: 'user', sub: 'Members and likes', href: '/family' },
  { id: 'share', label: 'Share weekend', icon: 'share', sub: 'Copy a link' },
  { id: 'sign-out', label: 'Sign out', icon: 'sign_out', tone: 'warn' },
];

describe('Menu', () => {
  let fixture: ComponentFixture<Menu>;
  let host: HTMLElement;

  const items = (): HTMLElement[] =>
    Array.from(host.querySelectorAll('.menu__item[role="menuitem"]'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Menu],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Menu);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a labelled menu with one menuitem per entry', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('menu')).toBe(true);
    expect(host.getAttribute('role')).toBe('menu');
    expect(host.getAttribute('aria-label')).toBe('Menu');
    expect(items().length).toBe(3);
    expect(items().map((i) => i.querySelector('.menu__label')?.textContent?.trim())).toEqual([
      'Family',
      'Share weekend',
      'Sign out',
    ]);
    expect(host.querySelector('.menu__header')).toBeNull();
    expect(host.classList.contains('menu--sheet')).toBe(false);
    expect(host.getAttribute('sheet')).toBeNull();
  });

  it('renders href items as anchors and the rest as buttons', () => {
    expect(items()[0]?.tagName).toBe('A');
    expect(items()[0]?.getAttribute('href')).toBe('/family');
    expect(items()[1]?.tagName).toBe('BUTTON');
    expect(items()[1]?.getAttribute('type')).toBe('button');
  });

  it('shows the header line and the warn tone', () => {
    fixture.componentRef.setInput('header', 'quinn@example.com');
    fixture.componentRef.setInput('label', 'Account');
    fixture.detectChanges();
    expect(host.querySelector('.menu__header')?.textContent?.trim()).toBe('quinn@example.com');
    expect(host.getAttribute('aria-label')).toBe('Account');
    expect(items()[2]?.classList.contains('menu__item--warn')).toBe(true);
    expect(items()[0]?.classList.contains('menu__item--warn')).toBe(false);
  });

  it('uses plain glyphs as a popover and discs with sub lines as a sheet', () => {
    expect(items()[0]?.querySelector('sd-icon')?.getAttribute('name')).toBe('user');
    expect(host.querySelector('sd-disc')).toBeNull();
    expect(host.querySelector('.menu__sub')).toBeNull();

    fixture.componentRef.setInput('sheet', true);
    fixture.detectChanges();
    expect(host.classList.contains('menu--sheet')).toBe(true);
    expect(host.getAttribute('sheet')).toBe('');
    expect(items()[0]?.querySelector('sd-disc')?.getAttribute('icon')).toBe('user');
    expect(items()[0]?.querySelector('.menu__sub')?.textContent?.trim()).toBe('Members and likes');
    expect(items()[2]?.querySelector('.menu__sub')).toBeNull();
  });

  it('emits the chosen item', () => {
    const spy = vi.fn();
    fixture.componentInstance.select.subscribe(spy);
    items()[1]?.click();
    expect(spy).toHaveBeenCalledWith(ITEMS[1]);
  });

  it('routes href items through the router on a plain click', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const spy = vi.fn();
    fixture.componentInstance.select.subscribe(spy);

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    items()[0]?.dispatchEvent(event);
    expect(spy).toHaveBeenCalledWith(ITEMS[0]);
    expect(navigate).toHaveBeenCalledWith('/family');
    expect(event.defaultPrevented).toBe(true);
  });

  it('moves focus with the arrow keys and wraps around', () => {
    items()[0]?.focus();
    expect(document.activeElement).toBe(items()[0]);

    const down = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    });
    host.dispatchEvent(down);
    expect(document.activeElement).toBe(items()[1]);
    expect(down.defaultPrevented).toBe(true);

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(items()[2]);

    const other = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    host.dispatchEvent(other);
    expect(other.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(items()[2]);
  });
});
