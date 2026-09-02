import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { MEMBER_NAMES } from '../../pages/dialogs/dialog-fixtures';
import { FamilyMemberDialog, FamilyMemberDialogData } from './family-member-dialog';

describe('FamilyMemberDialog', () => {
  let fixture: ComponentFixture<FamilyMemberDialog>;
  let component: FamilyMemberDialog;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  async function mount(data: FamilyMemberDialogData): Promise<void> {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [FamilyMemberDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FamilyMemberDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  const primary = (): HTMLElement =>
    host.querySelector('sd-button[slot="actions"][variant="primary"]') as HTMLElement;
  const field = (name: string): HTMLElement => host.querySelector(`sd-text-input[name="${name}"]`) as HTMLElement;

  it('adds a member: empty fields, no Remove, primary disabled until both are filled', async () => {
    await mount({ mode: 'add', existingNames: MEMBER_NAMES });
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Add a family member');
    expect(host.querySelector('.dialog__sub')?.textContent?.trim()).toBe('Ages shape the picks.');
    expect(primary().textContent?.trim()).toBe('Add member');
    expect(host.querySelector('sd-button[slot="actions-left"]')).toBeNull();
    expect(primary().hasAttribute('disabled')).toBe(true);

    component['name'].set('Theo');
    component['age'].set('3');
    fixture.detectChanges();
    expect(primary().hasAttribute('disabled')).toBe(false);
    component['submit']();
    expect(dialogRef.close).toHaveBeenCalledWith({ kind: 'save', name: 'Theo', age: 3 });
  });

  it('edits a member: prefilled, Save label, Remove on the left', async () => {
    await mount({ mode: 'edit', initial: { name: 'Mae', age: 5 }, existingNames: MEMBER_NAMES });
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Edit Mae');
    expect(primary().textContent?.trim()).toBe('Save');
    expect(component['name']()).toBe('Mae');
    expect(component['age']()).toBe('5');
    (host.querySelector('sd-button[slot="actions-left"] button') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith({ kind: 'remove' });
  });

  it('requires a name', async () => {
    await mount({ mode: 'add', existingNames: [] });
    component['name'].set('   ');
    component['age'].set('7');
    component['submit']();
    fixture.detectChanges();
    expect(component['error']()).toBe('Enter a name.');
    expect(field('memberName').getAttribute('error')).toBe('Enter a name.');
    expect(field('memberAge').getAttribute('error')).toBeNull();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('requires an integer age between 0 and 120', async () => {
    await mount({ mode: 'add', existingNames: [] });
    component['name'].set('Theo');
    for (const bad of ['5.5', '-1', '121', 'abc']) {
      component['age'].set(bad);
      component['submit']();
      expect(component['error']()).toBe('Enter an age between 0 and 120.');
    }
    fixture.detectChanges();
    expect(field('memberAge').getAttribute('error')).toBe('Enter an age between 0 and 120.');
    expect(dialogRef.close).not.toHaveBeenCalled();

    component['age'].set('0');
    component['submit']();
    expect(dialogRef.close).toHaveBeenCalledWith({ kind: 'save', name: 'Theo', age: 0 });
  });

  it('rejects a name someone else already has (case-insensitive), but allows keeping your own', async () => {
    await mount({ mode: 'edit', initial: { name: 'Mae', age: 5 }, existingNames: MEMBER_NAMES });
    component['name'].set('quinn');
    component['submit']();
    expect(component['error']()).toBe('Someone in the family already has that name.');
    expect(dialogRef.close).not.toHaveBeenCalled();

    component['name'].set('MAE');
    component['submit']();
    expect(dialogRef.close).toHaveBeenCalledWith({ kind: 'save', name: 'MAE', age: 5 });
  });

  it('hints at the role the age implies', async () => {
    await mount({ mode: 'add', existingNames: [] });
    expect(component['ageHint']()).toBe('Under 18 counts as a kid.');
    component['age'].set('9');
    expect(component['ageHint']()).toBe('Kid · under 18 counts as a kid.');
    component['age'].set('38');
    expect(component['ageHint']()).toBe('Parent · 18 and over.');
    fixture.detectChanges();
    expect(field('memberAge').getAttribute('hint')).toBe('Parent · 18 and over.');
  });

  it('closes with nothing on cancel', async () => {
    await mount({ mode: 'add', existingNames: [] });
    component['cancel']();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
