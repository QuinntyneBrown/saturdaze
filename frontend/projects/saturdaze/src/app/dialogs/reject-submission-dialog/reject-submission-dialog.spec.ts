import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Dialog as DialogShell } from 'components';
import { DialogRef } from '@angular/cdk/dialog';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { RejectSubmissionDialog } from './reject-submission-dialog';

describe('RejectSubmissionDialog', () => {
  let component: RejectSubmissionDialog;
  let fixture: ComponentFixture<RejectSubmissionDialog>;
  let mockDialogRef: any;
  let mockDIALOG_DATA: any;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockDIALOG_DATA = {};

    await TestBed.configureTestingModule({
      imports: [RejectSubmissionDialog],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: mockDIALOG_DATA },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RejectSubmissionDialog);
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
      imports: [RejectSubmissionDialog],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: mockDIALOG_DATA },
      ],
    });
    TestBed.overrideComponent(RejectSubmissionDialog, {
      remove: { imports: [DialogShell] },
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    await TestBed.compileComponents();
    const stubbedFixture = TestBed.createComponent(RejectSubmissionDialog);
    stubbedFixture.detectChanges();
    expect(stubbedFixture.nativeElement).toBeTruthy();
  });

  it('should call cancel without throwing', () => {
    expect(() => component['cancel']()).not.toThrow();
  });

  it('should call reject without throwing', () => {
    expect(() => component['reject']()).not.toThrow();
  });
});
