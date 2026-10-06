import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ICON_NAMES, Icon } from './icon';

describe('Icon', () => {
  let fixture: ComponentFixture<Icon>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Icon] }).compileComponents();
    fixture = TestBed.createComponent(Icon);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates and renders a decorative inline svg', () => {
    expect(fixture.componentInstance).toBeTruthy();
    const svg = host.querySelector('svg.icon') as SVGElement;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('exposes the sprite names', () => {
    expect(ICON_NAMES.length).toBe(40);
    for (const name of ['sparkle', 'home', 'star', 'user', 'lock', 'check']) {
      expect(ICON_NAMES).toContain(name);
    }
  });

  it('renders name, size and filled through the glyph, size variable and host class', () => {
    const svg = host.querySelector('svg') as SVGElement;
    expect(svg.innerHTML).toContain('M12 3l1.7 5.3');
    expect(host.classList.contains('icon--filled')).toBe(false);
    expect(host.style.getPropertyValue('--_size')).toBe('20px');

    fixture.componentRef.setInput('name', 'check');
    fixture.componentRef.setInput('size', 14);
    fixture.componentRef.setInput('filled', true);
    fixture.detectChanges();

    expect(svg.innerHTML).toContain('M5 12l5 5 9-11');
    expect(host.classList.contains('icon--filled')).toBe(true);
    expect(host.style.getPropertyValue('--_size')).toBe('14px');
  });

  it('accepts the attribute form of filled', () => {
    fixture.componentRef.setInput('filled', '');
    fixture.detectChanges();
    expect(host.classList.contains('icon--filled')).toBe(true);
  });

  it('draws the named glyph', () => {
    fixture.componentRef.setInput('name', 'check');
    fixture.detectChanges();
    expect(host.querySelector('svg')?.innerHTML).toContain('M5 12l5 5 9-11');
  });

  it('falls back to the sparkle glyph for an unknown name', () => {
    fixture.componentRef.setInput('name', 'sparkle');
    fixture.detectChanges();
    const sparkle = host.querySelector('svg')?.innerHTML;

    fixture.componentRef.setInput('name', 'does-not-exist');
    fixture.detectChanges();
    expect(host.querySelector('svg')?.innerHTML).toBe(sparkle);
  });

  it('forwards the stroke weight to the svg', () => {
    expect(host.querySelector('svg')?.getAttribute('stroke-width')).toBe('1.7');
    fixture.componentRef.setInput('stroke', 2);
    fixture.detectChanges();
    expect(host.querySelector('svg')?.getAttribute('stroke-width')).toBe('2');
  });
});
