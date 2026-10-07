import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { PhotoTileView } from 'api';

import { EditPhotoDialog } from './edit-photo-dialog';

// Traces to: L2-118 AC2
describe('EditPhotoDialog', () => {
  const tile = (overrides: Partial<PhotoTileView> = {}): PhotoTileView => ({
    id: 'p1',
    url: 'https://images.example.com/a.jpg',
    media: null,
    blocked: false,
    isPrimary: true,
    source: 'Curated',
    unreviewed: false,
    badges: [],
    alt: 'Lawn down to the lake',
    credit: 'Photo · Jo Doe',
    licence: 'CC BY 4.0',
    size: '1200 × 675',
    ...overrides,
  });

  function render(t: PhotoTileView) {
    const ref = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [EditPhotoDialog],
      providers: [
        { provide: DialogRef, useValue: ref },
        { provide: DIALOG_DATA, useValue: { tile: t } },
      ],
    });
    const fixture = TestBed.createComponent(EditPhotoDialog);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const input = (label: string) =>
      Array.from(host.querySelectorAll('label'))
        .find((l) => l.textContent?.trim().startsWith(label))!
        .parentElement!.querySelector('input, select') as HTMLInputElement | HTMLSelectElement;
    const save = () =>
      Array.from(host.querySelectorAll('.dialog__actions button')).find((b) =>
        b.textContent?.includes('Save changes'),
      ) as HTMLButtonElement;
    const type = (el: HTMLInputElement | HTMLSelectElement, value: string) => {
      el.value = value;
      el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input'));
      fixture.detectChanges();
    };
    return { host, ref, input, save, type };
  }

  it('starts from the photo and saves the trimmed details', () => {
    const { ref, input, save, type } = render(tile());
    expect((input('Attribution') as HTMLInputElement).value).toBe('Photo · Jo Doe');
    expect(save().disabled).toBe(false);
    type(input('Alt text'), '  The lawn  ');
    save().click();
    expect(ref.close).toHaveBeenCalledWith({
      alt: 'The lawn',
      attribution: 'Photo · Jo Doe',
      licence: 'CC BY 4.0',
    });
  });

  it('keeps Save disabled while attribution or licence is empty', () => {
    const { input, save, type } = render(tile({ credit: '' }));
    expect(save().disabled).toBe(true);
    type(input('Attribution'), 'Photo · Saturdaze');
    expect(save().disabled).toBe(false);
    type(input('Licence'), 'Other');
    expect(save().disabled).toBe(true);
    type(input('Licence text'), 'Venue permission, 2026');
    expect(save().disabled).toBe(false);
  });

  it('shows a licence outside the list as Other with its text', () => {
    const { input, ref, save } = render(tile({ licence: 'Venue permission' }));
    expect((input('Licence') as HTMLSelectElement).value).toBe('Other');
    expect((input('Licence text') as HTMLInputElement).value).toBe('Venue permission');
    save().click();
    expect(ref.close).toHaveBeenCalledWith(
      expect.objectContaining({ licence: 'Venue permission' }),
    );
  });
});
