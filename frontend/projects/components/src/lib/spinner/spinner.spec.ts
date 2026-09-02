import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Spinner } from './spinner';

describe('Spinner', () => {
  let fixture: ComponentFixture<Spinner>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Spinner] }).compileComponents();
    fixture = TestBed.createComponent(Spinner);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('creates a decorative ring with no glyph', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('.spinner')).not.toBeNull();
    expect(host.querySelector('sd-icon')).toBeNull();
    expect(host.classList.contains('spinner-disc')).toBe(false);
    expect(host.getAttribute('icon')).toBeNull();
    expect(host.getAttribute('size')).toBeNull();
  });

  it('becomes a spinner disc with the glyph inside when an icon is given', () => {
    fixture.componentRef.setInput('icon', 'sparkle');
    fixture.detectChanges();
    expect(host.classList.contains('spinner-disc')).toBe(true);
    expect(host.getAttribute('icon')).toBe('sparkle');
    expect(host.querySelector('sd-icon')?.getAttribute('name')).toBe('sparkle');
    expect(host.querySelector('.spinner')).not.toBeNull();
  });

  it('mirrors the small size to a class and attribute', () => {
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    expect(host.classList.contains('spinner--sm')).toBe(true);
    expect(host.getAttribute('size')).toBe('sm');
    fixture.componentRef.setInput('size', 'md');
    fixture.detectChanges();
    expect(host.classList.contains('spinner--sm')).toBe(false);
    expect(host.getAttribute('size')).toBeNull();
  });
});
