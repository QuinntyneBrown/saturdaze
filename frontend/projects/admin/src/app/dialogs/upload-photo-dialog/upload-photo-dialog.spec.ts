import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { UploadPhotoDialog, UploadPhotoDialogData } from './upload-photo-dialog';

// Traces to: L2-115 AC2, AC3, AC4
describe('UploadPhotoDialog', () => {
  const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

  function render(upload: UploadPhotoDialogData['upload'] = vi.fn(async () => undefined)) {
    const ref = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [UploadPhotoDialog],
      providers: [
        { provide: DialogRef, useValue: ref },
        { provide: DIALOG_DATA, useValue: { placeName: 'Riverwood Conservancy', upload } },
      ],
    });
    const fixture = TestBed.createComponent(UploadPhotoDialog);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const fileInput = host.querySelector('input[type="file"]') as HTMLInputElement;
    const pick = (file: File) => {
      Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
      fileInput.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };
    const save = () =>
      Array.from(host.querySelectorAll('.dialog__actions button')).find((b) =>
        b.textContent?.includes('Save photo'),
      ) as HTMLButtonElement;
    const banner = () => host.querySelector('.banner')?.textContent?.trim() ?? '';
    return { host, ref, pick, save, banner, fixture };
  }

  beforeEach(() => {
    // jsdom has no object URLs; the dialog only needs them for the preview.
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
  });

  it('keeps Save disabled until a photo is chosen, then sends it with its details', async () => {
    const upload = vi.fn(async () => undefined);
    const { ref, pick, save } = render(upload);
    expect(save().disabled).toBe(true);
    pick(new File([new Uint8Array(10)], 'park.jpg', { type: 'image/jpeg' }));
    expect(save().disabled).toBe(false);
    save().click();
    await settle();
    expect(upload).toHaveBeenCalledWith(expect.any(File), {
      alt: '',
      attribution: 'Photo · Saturdaze',
      licence: 'Saturdaze owned',
    });
    expect(ref.close).toHaveBeenCalledWith('uploaded');
  });

  it('refuses a file over 10 MB or of the wrong type before sending', () => {
    const { pick, save, banner } = render();
    const big = new File([new Uint8Array(1)], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 });
    pick(big);
    expect(banner()).toContain('over 10 MB');
    expect(save().disabled).toBe(true);

    pick(new File([new Uint8Array(10)], 'notes.pdf', { type: 'application/pdf' }));
    expect(banner()).toContain('not a photo');
    expect(save().disabled).toBe(true);
  });

  it('shows the server refusal in place and stays open', async () => {
    const upload = vi.fn(async () => {
      throw new HttpErrorResponse({ status: 400, error: { code: 'unsupported_image' } });
    });
    const { ref, pick, save, banner } = render(upload);
    pick(new File([new Uint8Array(10)], 'park.jpg', { type: 'image/jpeg' }));
    save().click();
    await settle();
    expect(banner()).toContain('not a photo');
    expect(ref.close).not.toHaveBeenCalled();
  });
});
