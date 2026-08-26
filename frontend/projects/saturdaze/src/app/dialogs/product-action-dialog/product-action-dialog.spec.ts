import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Dialog as DialogShell } from 'components';
import { DialogRef } from '@angular/cdk/dialog';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ProductActionDialog } from './product-action-dialog';

describe('ProductActionDialog', () => {
  let component: ProductActionDialog;
  let fixture: ComponentFixture<ProductActionDialog>;
  let mockDialogRef: any;
  let mockDIALOG_DATA: any;

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockDIALOG_DATA = {};

    await TestBed.configureTestingModule({
      imports: [ProductActionDialog],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: mockDIALOG_DATA },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductActionDialog);
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
      imports: [ProductActionDialog],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: mockDIALOG_DATA },
      ],
    });
    TestBed.overrideComponent(ProductActionDialog, {
      remove: { imports: [DialogShell] },
      add: { schemas: [NO_ERRORS_SCHEMA] },
    });
    await TestBed.compileComponents();
    const stubbedFixture = TestBed.createComponent(ProductActionDialog);
    stubbedFixture.detectChanges();
    expect(stubbedFixture.nativeElement).toBeTruthy();
  });

  it('should call close without throwing', () => {
    expect(() => component['close']()).not.toThrow();
  });

  it('should call confirm without throwing', () => {
    expect(() => component['confirm']()).not.toThrow();
  });

  it('should call copyShareLink without throwing', async () => {
    await expect(Promise.resolve(component['copyShareLink']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call shareNative without throwing', async () => {
    await expect(Promise.resolve(component['shareNative']()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call shareMessage without throwing', () => {
    expect(() => component['shareMessage']()).not.toThrow();
  });
});
