import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { ShareDialog } from './share-dialog';

describe('ShareDialog', () => {
  let fixture: ComponentFixture<ShareDialog>;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let stopSharing: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };
    stopSharing = vi.fn(async () => undefined);
    await TestBed.configureTestingModule({
      imports: [ShareDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        {
          provide: DIALOG_DATA,
          useValue: { shareUrl: 'https://saturdaze.app/sample-weekend?share=abc123', stopSharing },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ShareDialog);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('shows the read-only link in a copy field', () => {
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Share this weekend');
    expect(host.querySelector('.dialog__sub')?.textContent?.trim()).toBe(
      'Anyone with the link can view it. Nobody can edit.',
    );
    const copy = host.querySelector('sd-copy-field');
    expect(copy?.querySelector('.copy-field__value')?.textContent?.trim()).toBe(
      'https://saturdaze.app/sample-weekend?share=abc123',
    );
    expect(copy?.querySelector('button[aria-label="Copy link"]')).not.toBeNull();
    expect(host.querySelector('p.sd-text-xs')?.textContent?.trim()).toBe(
      'Read-only · expires in 7 days',
    );
  });

  it('closes on Done', () => {
    (
      host.querySelector('sd-button[slot="actions"] button.btn--primary') as HTMLButtonElement
    ).click();
    expect(dialogRef.close).toHaveBeenCalledWith();
    expect(stopSharing).not.toHaveBeenCalled();
  });

  it('stops sharing, then closes (L2-086 AC6)', async () => {
    await fixture.componentInstance['stop']();
    expect(stopSharing).toHaveBeenCalledTimes(1);
    expect(dialogRef.close).toHaveBeenCalledTimes(1);
  });

  it('stays open with a warning when stopping fails', async () => {
    stopSharing.mockRejectedValueOnce(new Error('offline'));
    await fixture.componentInstance['stop']();
    fixture.detectChanges();
    expect(host.querySelector('sd-banner')?.textContent).toContain('Could not stop sharing');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
