import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { ShareDialog } from './share-dialog';

describe('ShareDialog', () => {
  let fixture: ComponentFixture<ShareDialog>;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ShareDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { shareUrl: 'https://saturdaze.app/sample-weekend?share=abc123' } },
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
    expect(copy?.getAttribute('value')).toBe('https://saturdaze.app/sample-weekend?share=abc123');
    expect(copy?.querySelector('.copy-field__value')?.textContent?.trim()).toBe(
      'https://saturdaze.app/sample-weekend?share=abc123',
    );
    expect(host.querySelector('p.sd-text-xs')?.textContent?.trim()).toBe('Read-only · expires in 7 days');
  });

  it('closes on Done', () => {
    (host.querySelector('sd-button[slot="actions"] button') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
