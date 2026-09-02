import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Avatar } from './avatar';

describe('Avatar', () => {
  let fixture: ComponentFixture<Avatar>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Avatar] }).compileComponents();
    fixture = TestBed.createComponent(Avatar);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a decorative large avatar with a placeholder initial', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('avatar')).toBe(true);
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.textContent?.trim()).toBe('?');
    expect(host.getAttribute('name')).toBe('?');
    expect(host.getAttribute('size')).toBe('lg');
    expect(host.getAttribute('tone')).toBeNull();
  });

  it('renders the upper-cased first letter of the name', () => {
    fixture.componentRef.setInput('name', 'quinn');
    fixture.detectChanges();
    expect(host.textContent?.trim()).toBe('Q');
    expect(host.getAttribute('name')).toBe('quinn');

    fixture.componentRef.setInput('name', '  eli');
    fixture.detectChanges();
    expect(host.textContent?.trim()).toBe('E');
  });

  it('falls back to ? for a blank name', () => {
    fixture.componentRef.setInput('name', '   ');
    fixture.detectChanges();
    expect(host.textContent?.trim()).toBe('?');
  });

  it('maps person tones to the mock avatar classes', () => {
    const map: Record<string, string> = {
      primary: 'avatar--q',
      leaf: 'avatar--s',
      sky: 'avatar--e',
      sun: 'avatar--m',
      indoor: 'avatar--indoor',
    };
    for (const [tone, cls] of Object.entries(map)) {
      fixture.componentRef.setInput('tone', tone);
      fixture.detectChanges();
      expect(host.classList.contains(cls)).toBe(true);
      expect(host.getAttribute('tone')).toBe(tone);
    }
  });

  it('mirrors the size to a class and attribute', () => {
    for (const size of ['sm', 'md', 'xl']) {
      fixture.componentRef.setInput('size', size);
      fixture.detectChanges();
      expect(host.classList.contains(`avatar--${size}`)).toBe(true);
      expect(host.getAttribute('size')).toBe(size);
    }
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    expect(host.classList.contains('avatar--xl')).toBe(false);
    expect(host.getAttribute('size')).toBe('lg');
  });
});
