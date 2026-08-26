import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogRef } from '@angular/cdk/dialog';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ApproveSubmissionDialog } from './approve-submission-dialog';

describe('ApproveSubmissionDialog', () => {
  let component: ApproveSubmissionDialog;
  let fixture: ComponentFixture<ApproveSubmissionDialog>;
  let mockDialogRef: any;
  let mockDIALOG_DATA: any;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockDIALOG_DATA = {};

    await TestBed.configureTestingModule({
      imports: [ApproveSubmissionDialog],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: mockDIALOG_DATA },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApproveSubmissionDialog);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should render with mocked dependencies', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should call cancel without throwing', () => {
    expect(() => component['cancel']()).not.toThrow();
  });

  it('should call approve without throwing', () => {
    expect(() => component['approve']()).not.toThrow();
  });
});
