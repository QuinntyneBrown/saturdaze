import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

// Traces to: L2-160 AC6
describe('ConfirmDialog (AD7)', () => {
  function render(data: ConfirmDialogData) {
    const ref = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        { provide: DialogRef, useValue: ref },
        { provide: DIALOG_DATA, useValue: data },
      ],
    });
    const fixture = TestBed.createComponent(ConfirmDialog);
    fixture.detectChanges();
    return { host: fixture.nativeElement as HTMLElement, ref };
  }

  it('shows the question, what is kept, and closes with confirm', () => {
    const { host, ref } = render({
      title: 'Regenerate Saturday?',
      body: 'Sunday will not change.',
      well: {
        icon: 'lock',
        tone: 'accent',
        title: 'Keeping on Saturday',
        body: 'Swim lessons 9:00am',
      },
      confirmLabel: 'Regenerate Saturday',
      icon: 'refresh',
    });
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Regenerate Saturday?');
    expect(host.querySelector('.well__title')?.textContent?.trim()).toBe('Keeping on Saturday');
    const buttons = Array.from(host.querySelectorAll('.dialog__actions button'));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Cancel', 'Regenerate Saturday']);
    (buttons[1] as HTMLButtonElement).click();
    expect(ref.close).toHaveBeenCalledWith('confirm');
  });

  it('closes without a result on Cancel', () => {
    const { host, ref } = render({ title: 'Regenerate the weekend?' });
    (host.querySelector('.dialog__actions button') as HTMLButtonElement).click();
    expect(ref.close).toHaveBeenCalledWith();
  });
});
