import { Mock, vi } from 'vitest';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';

import { DEFAULT_PLANNING, PlanningSettings } from 'api';

import { CelebrationsDialog } from '../celebrations-dialog/celebrations-dialog';
import { DayShapeDialog } from '../day-shape-dialog/day-shape-dialog';
import { MaxDriveDialog, PlanningDialogData } from './max-drive-dialog';

/** Flush every pending microtask (the app is zoneless). */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('How you plan dialogs (D35–D37, L2-197)', () => {
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  let save: Mock<(next: PlanningSettings) => Promise<void>>;

  async function mount<T>(component: Type<T>) {
    dialogRef = { close: vi.fn() };
    save = vi.fn<(next: PlanningSettings) => Promise<void>>(async () => undefined);
    const data: PlanningDialogData = { initial: DEFAULT_PLANNING, save };
    await TestBed.configureTestingModule({
      imports: [component],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance as any,
      host: fixture.nativeElement as HTMLElement,
    };
  }

  it('D35 offers 30 min to 3 h and saves the chosen distance', async () => {
    const { component, host } = await mount(MaxDriveDialog);
    expect(Array.from(host.querySelectorAll('option')).map((o) => o.textContent?.trim())).toEqual([
      '30 min',
      '45 min',
      '1 h',
      '1 h 30',
      '2 h',
      '3 h',
    ]);
    component['minutes'].set('60');
    await component['save']();
    expect(save).toHaveBeenCalledWith({ ...DEFAULT_PLANNING, maxDriveMinutes: 60 });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('D35 stays open with the API message when the save is refused', async () => {
    const { fixture, component, host } = await mount(MaxDriveDialog);
    save.mockRejectedValueOnce(
      new HttpErrorResponse({
        status: 400,
        error: { errors: { MaxDriveMinutes: ['Max drive must be between 15 and 240 minutes.'] } },
      }),
    );
    await component['save']();
    await settle();
    fixture.detectChanges();
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(host.querySelector('sd-banner')?.textContent).toContain('between 15 and 240');
  });

  it('D36 leaves out the ticked themes and keeps Sunday quiet', async () => {
    const { component, host } = await mount(CelebrationsDialog);
    expect(
      Array.from(host.querySelectorAll('sd-checkbox')).map((c) => c.textContent?.trim()),
    ).toEqual([
      'Halloween',
      'Christmas',
      'Easter',
      "Valentine's Day",
      'Alcohol-focused',
      'Scary or horror',
    ]);
    component['setExcluded']('halloween', true);
    component['setExcluded']('horror', true);
    component['setExcluded']('horror', false);
    component['quietSunday'].set(true);
    await component['save']();
    expect(save).toHaveBeenCalledWith({
      ...DEFAULT_PLANNING,
      excludedThemes: ['halloween'],
      quietSunday: true,
    });
  });

  it('D37 saves the day start, bedtime, pace, leaning and Sunday dinner', async () => {
    const { component } = await mount(DayShapeDialog);
    component['dayStart'].set('10:00');
    component['bedtime'].set('19:30');
    component['outings'].set('1');
    component['leaning'].set('Outdoor');
    component['sundayDinnerAtHome'].set(false);
    await component['save']();
    expect(save).toHaveBeenCalledWith({
      ...DEFAULT_PLANNING,
      dayStart: '10:00',
      youngestBedtime: '19:30',
      outingsPerDay: 1,
      leaning: 'Outdoor',
      sundayDinnerAtHome: false,
    });

    component['bedtime'].set('');
    await component['save']();
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ youngestBedtime: null }));
  });
});
