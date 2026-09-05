import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { HomeLocationDialog } from './home-location-dialog';

describe('HomeLocationDialog', () => {
  let fixture: ComponentFixture<HomeLocationDialog>;
  let component: HomeLocationDialog;
  let host: HTMLElement;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [HomeLocationDialog],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: { location: 'Port Credit, Mississauga' } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HomeLocationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  const primary = (): HTMLElement =>
    host.querySelector('sd-button[slot="actions"][variant="primary"]') as HTMLElement;

  it('prefills the current home', () => {
    expect(host.querySelector('.dialog__title')?.textContent?.trim()).toBe('Home location');
    expect(host.querySelector('.dialog__sub')?.textContent?.trim()).toBe('Weather and drive times start here.');
    expect(host.querySelector('sd-text-input')?.getAttribute('label')).toBe('Neighbourhood or address');
    expect(component['location']()).toBe('Port Credit, Mississauga');
    expect(primary().hasAttribute('disabled')).toBe(false);
  });

  it('will not save a blank location', () => {
    component['location'].set('   ');
    fixture.detectChanges();
    expect(primary().hasAttribute('disabled')).toBe(true);
    component['save']();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('saves the trimmed value', () => {
    component['location'].set('  Lorne Park ');
    component['save']();
    expect(dialogRef.close).toHaveBeenCalledWith('Lorne Park');
  });

  it('closes with nothing on cancel', () => {
    (host.querySelector('sd-button[slot="actions"][variant="quiet"] button') as HTMLButtonElement).click();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
