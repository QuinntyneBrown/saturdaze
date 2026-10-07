import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { RejectPhotoDialog } from './reject-photo-dialog';

// Traces to: L2-120 AC4
describe('RejectPhotoDialog', () => {
  function render() {
    const ref = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [RejectPhotoDialog],
      providers: [
        { provide: DialogRef, useValue: ref },
        { provide: DIALOG_DATA, useValue: { media: null, placeName: 'Harbour Grill' } },
      ],
    });
    const fixture = TestBed.createComponent(RejectPhotoDialog);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const action = (name: string) =>
      Array.from(host.querySelectorAll('.dialog__actions button')).find((b) =>
        b.textContent?.includes(name),
      ) as HTMLButtonElement;
    return { host, ref, action, fixture };
  }

  it('names the place and closes with the trimmed reason', () => {
    const { host, ref, action, fixture } = render();
    expect(host.querySelector('.dialog__sub')?.textContent).toContain('Harbour Grill');
    const reason = host.querySelector('textarea[name="reason"]') as HTMLTextAreaElement;
    reason.value = '  Wrong venue ';
    reason.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    action('Reject').click();
    expect(ref.close).toHaveBeenCalledWith({ reason: 'Wrong venue' });
  });

  it('rejects without a reason, and Cancel closes with nothing', () => {
    const { ref, action } = render();
    action('Reject').click();
    expect(ref.close).toHaveBeenCalledWith({ reason: '' });
    action('Cancel').click();
    expect(ref.close).toHaveBeenLastCalledWith();
  });
});
