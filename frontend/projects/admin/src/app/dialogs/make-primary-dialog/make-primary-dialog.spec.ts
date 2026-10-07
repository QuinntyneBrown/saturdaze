import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import {
  MakePrimaryDialog,
  MakePrimaryDialogData,
  coverImpactWarning,
} from './make-primary-dialog';

// Traces to: L2-117 AC2
describe('MakePrimaryDialog', () => {
  const data = (coverImpact: number): MakePrimaryDialogData => ({
    media: null,
    placeName: 'Port Credit Memorial Park',
    coverImpact,
  });

  function render(coverImpact: number) {
    const ref = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [MakePrimaryDialog],
      providers: [
        { provide: DialogRef, useValue: ref },
        { provide: DIALOG_DATA, useValue: data(coverImpact) },
      ],
    });
    const fixture = TestBed.createComponent(MakePrimaryDialog);
    fixture.detectChanges();
    return { host: fixture.nativeElement as HTMLElement, ref };
  }

  it('states how many weekend covers will change before confirming', () => {
    const { host } = render(5);
    expect(host.querySelector('.well__title')?.textContent?.trim()).toBe(
      '5 weekend covers will change',
    );
    expect(host.querySelector('.dialog__sub')?.textContent).toContain('Port Credit Memorial Park');
  });

  it('says when no weekend covers follow the place', () => {
    const { host } = render(0);
    expect(host.querySelector('.well__title')?.textContent?.trim()).toBe(
      'No weekend covers follow this place',
    );
  });

  it('closes with confirm from the primary action and empty from Cancel', () => {
    const { host, ref } = render(1);
    const buttons = Array.from(host.querySelectorAll('.dialog__actions button'));
    (buttons.find((b) => b.textContent?.includes('Make primary')) as HTMLButtonElement).click();
    expect(ref.close).toHaveBeenCalledWith('confirm');
    (buttons.find((b) => b.textContent?.includes('Cancel')) as HTMLButtonElement).click();
    expect(ref.close).toHaveBeenLastCalledWith();
  });

  it('pluralises the warning', () => {
    expect(coverImpactWarning(1)).toBe('1 weekend cover will change');
    expect(coverImpactWarning(2)).toBe('2 weekend covers will change');
  });
});
