import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardMedia, Media } from './media';

const PHOTO: CardMedia = {
  src: 'https://images.example.com/terre-bleu.jpg',
  alt: 'Rows of lavender',
  width: 1600,
  height: 900,
  credit: 'Photo · Jo Doe',
};

describe('Media', () => {
  let fixture: ComponentFixture<Media>;
  let host: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(Media);
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders a sized, lazy image with its credit', () => {
    fixture.componentRef.setInput('photo', PHOTO);
    fixture.detectChanges();
    const img = host.querySelector('img.media__img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(PHOTO.src);
    expect(img.getAttribute('alt')).toBe('Rows of lavender');
    expect(img.getAttribute('width')).toBe('1600');
    expect(img.getAttribute('height')).toBe('900');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(host.querySelector('.media__credit')?.textContent?.trim()).toBe('Photo · Jo Doe');
    expect(host.getAttribute('aria-hidden')).toBeNull();
  });

  it('loads eagerly above the fold', () => {
    fixture.componentRef.setInput('photo', PHOTO);
    fixture.componentRef.setInput('eager', true);
    fixture.detectChanges();
    expect(host.querySelector('img')?.getAttribute('loading')).toBe('eager');
  });

  it('shows an aria-hidden tinted tile with an icon when there is no photo', () => {
    fixture.componentRef.setInput('tone', 'leaf');
    fixture.componentRef.setInput('icon', 'tree');
    fixture.detectChanges();
    expect(host.classList).toContain('media--fallback');
    expect(host.classList).toContain('media--leaf');
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('img')).toBeNull();
    expect(host.querySelector('sd-icon svg')?.innerHTML).toContain(
      'M12 3l-5 7h3l-4 6h12l-4-6h3l-5-7z',
    );
  });

  it('falls back to the tile when the image fails to load', () => {
    fixture.componentRef.setInput('photo', PHOTO);
    fixture.detectChanges();
    host.querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(host.classList).toContain('media--fallback');
    expect(host.querySelector('img')).toBeNull();
  });

  it('switches to a 4:3 frame', () => {
    fixture.componentRef.setInput('ratio', '4:3');
    fixture.detectChanges();
    expect(host.classList).toContain('media--4x3');
  });
});
