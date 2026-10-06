import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { PhotoTileView } from 'api';

import { NO_PHOTO, RemovePhotoDialog, defaultNextPrimary } from './remove-photo-dialog';

// Traces to: L2-119 AC1
describe('RemovePhotoDialog', () => {
  const tile = (overrides: Partial<PhotoTileView>): PhotoTileView => ({
    id: 'p',
    url: 'https://images.example.com/a.jpg',
    media: null,
    blocked: false,
    isPrimary: false,
    source: 'Curated',
    unreviewed: false,
    badges: [],
    alt: '',
    credit: 'Photo · Jo Doe',
    licence: 'CC BY 4.0',
    size: '1200 × 675',
    ...overrides,
  });

  function render(target: PhotoTileView, siblings: PhotoTileView[]) {
    const ref = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [RemovePhotoDialog],
      providers: [
        { provide: DialogRef, useValue: ref },
        {
          provide: DIALOG_DATA,
          useValue: { tile: target, siblings, placeName: 'Memorial Park', coverImpact: 2 },
        },
      ],
    });
    const fixture = TestBed.createComponent(RemovePhotoDialog);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const remove = () =>
      Array.from(host.querySelectorAll('.dialog__actions button')).find((b) =>
        b.textContent?.includes('Remove photo'),
      ) as HTMLButtonElement;
    return { host, ref, remove, fixture };
  }

  it('defaults to the next curated photo, then a reviewed provider photo, then no photo', () => {
    const curated = tile({ id: 'c', source: 'Curated' });
    const reviewed = tile({ id: 'r', source: 'Provider', unreviewed: false });
    const unreviewed = tile({ id: 'u', source: 'Provider', unreviewed: true });
    expect(defaultNextPrimary([unreviewed, reviewed, curated])).toBe('c');
    expect(defaultNextPrimary([unreviewed, reviewed])).toBe('r');
    expect(defaultNextPrimary([unreviewed])).toBe(NO_PHOTO);
    expect(defaultNextPrimary([])).toBe(NO_PHOTO);
  });

  it('makes the administrator pick the next primary when removing the primary', () => {
    const primary = tile({ id: 'p', isPrimary: true });
    const other = tile({ id: 'o', alt: 'The bandshell' });
    const { host, ref, remove, fixture } = render(primary, [other]);
    expect(host.querySelector('.dialog__title')?.textContent).toContain(
      'Remove the primary photo?',
    );
    const radios = Array.from(host.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    expect(radios.map((r) => r.value)).toEqual(['o', NO_PHOTO]);
    expect(radios[0].checked).toBe(true);

    radios[1].checked = true;
    radios[1].dispatchEvent(new Event('change'));
    fixture.detectChanges();
    remove().click();
    expect(ref.close).toHaveBeenCalledWith({ nextPrimaryId: NO_PHOTO });
  });

  it('just confirms for a non-primary photo', () => {
    const { host, ref, remove } = render(tile({ id: 'x' }), [tile({ id: 'p', isPrimary: true })]);
    expect(host.querySelector('.dialog__title')?.textContent).toContain('Remove this photo?');
    expect(host.querySelectorAll('input[type="radio"]')).toHaveLength(0);
    remove().click();
    expect(ref.close).toHaveBeenCalledWith({ nextPrimaryId: null });
  });
});
