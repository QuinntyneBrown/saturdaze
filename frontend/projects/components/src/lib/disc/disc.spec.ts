import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Disc } from './disc';

describe('Disc', () => {
  let fixture: ComponentFixture<Disc>;
  let host: HTMLElement;

  const icon = (): HTMLElement => host.querySelector('sd-icon') as HTMLElement;
  const glyph = (): string => icon().querySelector('svg')?.innerHTML ?? '';
  const iconSize = (): string => icon().style.getPropertyValue('--_size');

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
    expect(glyph()).toContain('M12 3l1.7 5.3L19 10l-5.3 1.7L12 17');
    expect(host.className.trim()).toBe('disc');
  });

  it('forwards the icon name', () => {
    fixture.componentRef.setInput('icon', 'fork');
    fixture.detectChanges();
    expect(glyph()).toContain('M7 3v8a2 2 0 0 0 4 0V3');
  });

  it('mirrors every tone to a host class', () => {
    for (const tone of ['accent', 'primary', 'warn', 'sun', 'sky', 'leaf', 'indoor', 'surface']) {
      fixture.componentRef.setInput('tone', tone);
      fixture.detectChanges();
      expect(host.classList.contains(`disc--${tone}`)).toBe(true);
    }
  });

  it('mirrors the size to a host class and scales the glyph with it', () => {
    expect(iconSize()).toBe('20px');

    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    expect(host.classList.contains('disc--sm')).toBe(true);
    expect(iconSize()).toBe('16px');

    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    expect(host.classList.contains('disc--lg')).toBe(true);
    expect(iconSize()).toBe('20px');

    fixture.componentRef.setInput('size', 'xl');
    fixture.detectChanges();
    expect(host.classList.contains('disc--xl')).toBe(true);
    expect(host.classList.contains('disc--lg')).toBe(false);
    expect(iconSize()).toBe('26px');
  });
});
