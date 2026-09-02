import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { ConfirmDialog, confirmWith } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<ConfirmDialog>;
  let component: ConfirmDialog;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: { title: 'Delete Mae?', body: 'Gone for good.', confirmLabel: 'Delete', danger: true, icon: 'trash' } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the question and a danger confirm button', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Delete Mae?');
    expect(el.textContent).toContain('Gone for good.');
    const buttons = Array.from(el.querySelectorAll('sd-button'));
    expect(buttons[1]!.getAttribute('variant')).toBe('danger');
    expect(buttons[1]!.textContent).toContain('Delete');
  });

  it('closes with confirm or nothing', () => {
    component['confirm']();
    expect(mockDialogRef.close).toHaveBeenCalledWith('confirm');
    component['cancel']();
    expect(mockDialogRef.close).toHaveBeenLastCalledWith();
  });

  it('confirmWith resolves true only on confirm', async () => {
    const dialog = { open: vi.fn(() => ({ closed: of('confirm') })) } as any;
    await expect(confirmWith(dialog, { title: 'x' })).resolves.toBe(true);
    dialog.open = vi.fn(() => ({ closed: of(undefined) }));
    await expect(confirmWith(dialog, { title: 'x' })).resolves.toBe(false);
  });
});
