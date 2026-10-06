import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AddPhotoUrlDialog, AddPhotoUrlDialogData } from './add-photo-url-dialog';

// Traces to: L2-116 AC1, AC2
describe('AddPhotoUrlDialog', () => {
  const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

  function render(add: AddPhotoUrlDialogData['add'] = vi.fn(async () => undefined)) {
    const ref = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [AddPhotoUrlDialog],
      providers: [
        { provide: DialogRef, useValue: ref },
        { provide: DIALOG_DATA, useValue: { placeName: 'Riverwood Conservancy', add } },
      ],
    });
    const fixture = TestBed.createComponent(AddPhotoUrlDialog);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const input = (name: string) => host.querySelector(`input[name="${name}"]`) as HTMLInputElement;
    const type = (name: string, value: string) => {
      const el = input(name);
      el.value = value;
      el.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const save = () =>
      Array.from(host.querySelectorAll('.dialog__actions button')).find((b) =>
        b.textContent?.includes('Save photo'),
      ) as HTMLButtonElement;
    const fieldError = () => host.querySelector('.field__error')?.textContent?.trim() ?? '';
    return { ref, type, save, fieldError };
  }

  it('refuses a non-HTTPS address before sending and keeps Save disabled', () => {
    const add = vi.fn(async () => undefined);
    const { type, save, fieldError } = render(add);
    type('attribution', 'Photo · City');
    type('url', 'http://images.example.com/a.jpg');
    expect(fieldError()).toBe("This address isn't on the image allow-list.");
    expect(save().disabled).toBe(true);
    expect(add).not.toHaveBeenCalled();
  });

  it('sends an HTTPS address with its details', async () => {
    const add = vi.fn(async () => undefined);
    const { ref, type, save } = render(add);
    type('url', 'https://images.example.com/a.jpg');
    type('attribution', 'Photo · City');
    expect(save().disabled).toBe(false);
    save().click();
    await settle();
    expect(add).toHaveBeenCalledWith('https://images.example.com/a.jpg', {
      alt: '',
      attribution: 'Photo · City',
      licence: 'CC BY 4.0',
    });
    expect(ref.close).toHaveBeenCalledWith('added');
  });

  it('shows the server refusal under the field until the address changes', async () => {
    const add = vi.fn(async () => {
      throw new HttpErrorResponse({ status: 400, error: { code: 'url_not_allowed' } });
    });
    const { ref, type, save, fieldError } = render(add);
    type('url', 'https://elsewhere.example.net/a.jpg');
    type('attribution', 'Photo · City');
    save().click();
    await settle();
    TestBed.inject(DialogRef);
    expect(fieldError()).toBe("This address isn't on the image allow-list.");
    expect(save().disabled).toBe(true);
    expect(ref.close).not.toHaveBeenCalled();
    type('url', 'https://images.example.com/b.jpg');
    expect(fieldError()).toBe('');
    expect(save().disabled).toBe(false);
  });
});
