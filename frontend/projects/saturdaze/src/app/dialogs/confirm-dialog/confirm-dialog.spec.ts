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
    // The shell's own close button is the first sd-button; the action row follows.
    const buttons = Array.from(el.querySelectorAll('sd-button[slot="actions"]'));
    expect(buttons.length).toBe(2);
    expect(buttons[0]!.getAttribute('variant')).toBe('quiet');
    expect(buttons[0]!.textContent).toContain('Cancel');
    expect(buttons[1]!.getAttribute('variant')).toBe('danger');
    expect(buttons[1]!.textContent).toContain('Delete');
    expect(buttons[1]!.querySelector('sd-icon')?.getAttribute('name')).toBe('trash');
  });

  it('renders the optional well and custom labels', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        {
          provide: DIALOG_DATA,
          useValue: {
            title: 'Sign out?',
            cancelLabel: 'Stay signed in',
            well: { icon: 'lock', tone: 'accent', title: 'Keeping', body: 'Swim 9:00' },
          },
        },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(ConfirmDialog);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    const well = el.querySelector('sd-well');
    expect(well?.getAttribute('title')).toBe('Keeping');
    expect(well?.getAttribute('tone')).toBe('accent');
    expect(well?.textContent).toContain('Swim 9:00');
    const buttons = Array.from(el.querySelectorAll('sd-button[slot="actions"]'));
    expect(buttons[0]!.textContent?.trim()).toBe('Stay signed in');
    expect(buttons[1]!.getAttribute('variant')).toBe('primary');
    expect(buttons[1]!.textContent?.trim()).toBe('Confirm');
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
