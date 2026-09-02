import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { RenameWeekendDialog } from './rename-weekend-dialog';

describe('RenameWeekendDialog', () => {
  let fixture: ComponentFixture<RenameWeekendDialog>;
  let component: RenameWeekendDialog;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  async function mount(title: string | null): Promise<void> {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [RenameWeekendDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { eyebrow: '10 – 11 May 2026', title } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RenameWeekendDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  it('prefills the current name under the weekend eyebrow', async () => {
    await mount('Bronte Creek + Rec Room');
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Rename this weekend');
    expect(host.querySelector('.dialog__sub')?.textContent?.trim()).toBe('10 – 11 May 2026');
    expect(host.querySelector('sd-text-input')?.getAttribute('label')).toBe('Title');
    expect(component['title']()).toBe('Bronte Creek + Rec Room');
  });

  it('starts blank for an unnamed weekend', async () => {
    await mount(null);
    expect(component['title']()).toBe('');
  });

  it('saves the trimmed title, and null when blank (back to the generated name)', async () => {
    await mount('Old');
    component['title'].set('  Lavender weekend ');
    component['save']();
    expect(dialogRef.close).toHaveBeenCalledWith({ title: 'Lavender weekend' });

    component['title'].set('   ');
    component['save']();
    expect(dialogRef.close).toHaveBeenLastCalledWith({ title: null });
  });

  it('submits from the form and prevents the native submit', async () => {
    await mount('Old');
    const event = new Event('submit', { cancelable: true });
    component['save'](event);
    expect(event.defaultPrevented).toBe(true);
    expect(dialogRef.close).toHaveBeenCalledWith({ title: 'Old' });
  });

  it('closes with nothing on cancel', async () => {
    await mount('Old');
    (host.querySelector('sd-button[slot="actions"][variant="quiet"] button') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
