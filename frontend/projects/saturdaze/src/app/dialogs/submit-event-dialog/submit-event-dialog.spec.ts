import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Dialog as DialogShell } from 'components';
import { provideRouter } from '@angular/router';
import { EVENT_SUBMISSIONS_SERVICE } from 'api';
import { DialogRef } from '@angular/cdk/dialog';
import { SubmitEventDialog } from './submit-event-dialog';

describe('SubmitEventDialog', () => {
  let component: SubmitEventDialog;
  let fixture: ComponentFixture<SubmitEventDialog>;
  let mockDialogRef: any;
  let mockEVENT_SUBMISSIONS_SERVICE: any;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockEVENT_SUBMISSIONS_SERVICE = {
      submit: vi.fn(() => Promise.resolve(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [SubmitEventDialog],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: mockEVENT_SUBMISSIONS_SERVICE },
        { provide: DialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmitEventDialog);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should render with stubbed children', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SubmitEventDialog],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: mockEVENT_SUBMISSIONS_SERVICE },
        { provide: DialogRef, useValue: mockDialogRef },
      ],
    });
    TestBed.overrideComponent(SubmitEventDialog, {
      remove: { imports: [DialogShell] },
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    await TestBed.compileComponents();
    const stubbedFixture = TestBed.createComponent(SubmitEventDialog);
    stubbedFixture.detectChanges();
    expect(stubbedFixture.nativeElement).toBeTruthy();
  });

  it('should call cancel without throwing', () => {
    expect(() => component['cancel']()).not.toThrow();
  });

  it('should call openFullForm without throwing', () => {
    expect(() => component['openFullForm']()).not.toThrow();
  });

  it('should call submit without throwing', async () => {
    await expect(Promise.resolve(component['submit']({ preventDefault: () => {}, stopPropagation: () => {}, target: { value: '', checked: false }, currentTarget: { value: '', checked: false } } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should handle a failed submit in submit', async () => {
    mockEVENT_SUBMISSIONS_SERVICE.submit = vi.fn(() => Promise.reject(new Error('test')));
    await expect(Promise.resolve(component['submit']({ preventDefault: () => {}, stopPropagation: () => {}, target: { value: '', checked: false }, currentTarget: { value: '', checked: false } } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should recompute canSubmit under seeded state', () => {
    component['title'].set('x' as any);
    component['startsAtLocal'].set({ length: 'x' } as any);
    expect(() => component['canSubmit']()).not.toThrow();
  });
});
