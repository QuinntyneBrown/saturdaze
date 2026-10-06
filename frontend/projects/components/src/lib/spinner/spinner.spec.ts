import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Icon } from '../icon/icon';
import { Spinner } from './spinner';

/** The svg markup `sd-icon` draws for `name`, to compare against a rendered glyph. */
const glyph = (name: string): string => {
  const ref = TestBed.createComponent(Icon);
  ref.componentRef.setInput('name', name);
  ref.detectChanges();
  return (ref.nativeElement as HTMLElement).querySelector('svg')?.innerHTML ?? '';
};
const drawn = (icon: Element | null): string => icon?.querySelector('svg')?.innerHTML ?? '';

describe('Spinner', () => {
  let fixture: ComponentFixture<Spinner>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Spinner, Icon] }).compileComponents();
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
  });

  it('becomes a spinner disc with the glyph inside when an icon is given', () => {
    fixture.componentRef.setInput('icon', 'sparkle');
    fixture.detectChanges();
    expect(host.classList.contains('spinner-disc')).toBe(true);
    expect(drawn(host.querySelector('sd-icon'))).toBe(glyph('sparkle'));
    expect(host.querySelector('.spinner')).not.toBeNull();
  });

  it('mirrors the small size to a host class', () => {
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    expect(host.classList.contains('spinner--sm')).toBe(true);
    fixture.componentRef.setInput('size', 'md');
    fixture.detectChanges();
    expect(host.classList.contains('spinner--sm')).toBe(false);
  });
});
