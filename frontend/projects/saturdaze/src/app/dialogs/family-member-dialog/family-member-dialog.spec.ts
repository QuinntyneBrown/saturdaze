import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Dialog as DialogShell } from 'components';
import { DialogRef } from '@angular/cdk/dialog';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { FamilyMemberDialog } from './family-member-dialog';

describe('FamilyMemberDialog', () => {
  let component: FamilyMemberDialog;
  let fixture: ComponentFixture<FamilyMemberDialog>;
  let mockDialogRef: any;
  let mockDIALOG_DATA: any;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockDIALOG_DATA = {};

    await TestBed.configureTestingModule({
      imports: [FamilyMemberDialog],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: mockDIALOG_DATA },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FamilyMemberDialog);
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
      imports: [FamilyMemberDialog],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: mockDIALOG_DATA },
      ],
    });
    TestBed.overrideComponent(FamilyMemberDialog, {
      remove: { imports: [DialogShell] },
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    await TestBed.compileComponents();
    const stubbedFixture = TestBed.createComponent(FamilyMemberDialog);
    stubbedFixture.detectChanges();
    expect(stubbedFixture.nativeElement).toBeTruthy();
  });

  it('should call cancel without throwing', () => {
    expect(() => component['cancel']()).not.toThrow();
  });

  it('should call submit without throwing', () => {
    expect(() => component['submit']({ preventDefault: () => {}, stopPropagation: () => {}, target: { value: '', checked: false }, currentTarget: { value: '', checked: false } } as any)).not.toThrow();
  });

  it('should recompute canSubmit under seeded state', () => {
    component['name'].set('x' as any);
    expect(() => component['canSubmit']()).not.toThrow();
  });
});
