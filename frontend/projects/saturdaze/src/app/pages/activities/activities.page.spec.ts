import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { ACTIVITY_SERVICE, FAMILY_SERVICE, type ActivityView } from 'api';
import { ActivitiesPage } from './activities.page';

describe('ActivitiesPage', () => {
  let component: ActivitiesPage;
  let fixture: ComponentFixture<ActivitiesPage>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let activities: any;
  const view = signal<ActivityView>({
    filters: [
      { label: 'All', tone: 'primary' },
      { label: 'Indoor', tone: 'indoor' },
    ],
    sections: [
      { title: "This weekend's weather-fit", activities: [{ title: 'Bronte Creek', icon: 'tree', tone: 'outdoor' }] },
      { title: 'If weather turns', activities: [] },
      { title: 'Try something new', activities: [{ title: 'Zoo', icon: 'tree', tone: 'outdoor', tag: 'First time' }] },
    ],
  });
  const filter = signal('All');
  const profile = signal<any>({ familyName: 'The Browns', location: 'Port Credit', likes: [], preferences: [] });
  const editable = signal<any>({ members: [{ name: 'Quinn', age: 41 }, { name: 'Eli', age: 9 }, { name: 'Mae', age: 5 }] });

  beforeEach(async () => {
    mockDialog = { open: vi.fn() };
    activities = { list: () => view, activeFilter: () => filter, setFilter: vi.fn((l: string) => filter.set(l)) };

    await TestBed.configureTestingModule({
      imports: [ActivitiesPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: ACTIVITY_SERVICE, useValue: activities },
        { provide: FAMILY_SERVICE, useValue: { getProfile: () => profile, getEditableProfile: () => editable } },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivitiesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('builds the lede from the family instead of hard-coded names', () => {
    expect(component['heading']()).toBe('Picked for The Browns');
    expect(component['lede']()).toBe('Curated around Eli (9) and Mae (5), close to Port Credit.');
    profile.set({ familyName: null, location: '', likes: [], preferences: [] });
    editable.set({ members: [] });
    expect(component['heading']()).toBe('Picked for your family');
    expect(component['lede']()).toBe('Curated for your family, close to home.');
  });

  it('renders three sections and an empty note', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('sd-section')).toHaveLength(3);
    expect(el.querySelectorAll('sd-activity-card')).toHaveLength(2);
    expect(el.textContent).toContain('Nothing here for this filter.');
  });

  it('wires the chips to the service filter', () => {
    const chips = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('sd-tag-group sd-chip')) as HTMLElement[];
    chips[1]!.click();
    expect(activities.setFilter).toHaveBeenCalledWith('Indoor');
  });

  it('opens the try-new sheet with the try-new picks', () => {
    component['trySomethingNew']();
    expect(mockDialog.open.mock.calls[0][1].data).toEqual({
      kind: 'surprise',
      activities: [{ title: 'Zoo', icon: 'tree', tone: 'outdoor', tag: 'First time' }],
    });
  });
});
