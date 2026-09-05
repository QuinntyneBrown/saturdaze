import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Disc } from './disc';

describe('Disc', () => {
  let fixture: ComponentFixture<Disc>;
  let host: HTMLElement;

  const icon = (): HTMLElement => host.querySelector('sd-icon') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Disc] }).compileComponents();
    fixture = TestBed.createComponent(Disc);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a decorative disc with the sparkle glyph', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.classList.contains('disc')).toBe(true);
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(icon().getAttribute('name')).toBe('sparkle');
    expect(host.getAttribute('icon')).toBe('sparkle');
    expect(host.getAttribute('tone')).toBeNull();
    expect(host.getAttribute('size')).toBeNull();
  });

  it('forwards the icon name', () => {
    fixture.componentRef.setInput('icon', 'fork');
    fixture.detectChanges();
    expect(icon().getAttribute('name')).toBe('fork');
    expect(host.getAttribute('icon')).toBe('fork');
  });

  it('mirrors every tone to a host class and attribute', () => {
    for (const tone of ['accent', 'primary', 'warn', 'sun', 'sky', 'leaf', 'indoor', 'surface']) {
      fixture.componentRef.setInput('tone', tone);
      fixture.detectChanges();
      expect(host.classList.contains(`disc--${tone}`)).toBe(true);
      expect(host.getAttribute('tone')).toBe(tone);
    }
  });

  it('mirrors the size and scales the glyph with it', () => {
    expect(icon().getAttribute('size')).toBe('20');

    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    expect(host.classList.contains('disc--sm')).toBe(true);
    expect(host.getAttribute('size')).toBe('sm');
    expect(icon().getAttribute('size')).toBe('16');

    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    expect(host.classList.contains('disc--lg')).toBe(true);
    expect(icon().getAttribute('size')).toBe('20');

    fixture.componentRef.setInput('size', 'xl');
    fixture.detectChanges();
    expect(host.classList.contains('disc--xl')).toBe(true);
    expect(host.classList.contains('disc--lg')).toBe(false);
    expect(icon().getAttribute('size')).toBe('26');
  });
});
