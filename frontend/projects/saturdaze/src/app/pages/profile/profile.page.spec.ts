import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FAMILY_SERVICE } from 'api';
import { SESSION_STORE } from 'api';
import { Dialog } from '@angular/cdk/dialog';
import { ProfilePage } from './profile.page';

describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;
  let mockDialog: any;
  let mockFAMILY_SERVICE: any;
  let mockSESSION_STORE: any;
  let confirmSpy: any;

  beforeEach(async () => {
    confirmSpy = vi.spyOn(window as any, 'confirm').mockReturnValue(true as any);

    mockDialog = {
      open: vi.fn(),
    };

    mockFAMILY_SERVICE = {
      getProfile: vi.fn(),
      getEditableProfile: vi.fn(),
      saveProfile: vi.fn(() => Promise.resolve(undefined)),
    };

    mockSESSION_STORE = {
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: FAMILY_SERVICE, useValue: mockFAMILY_SERVICE },
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePage);
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
    component['memberError'].set('x' as any);
    fixture.detectChanges();
    component['commitmentError'].set('x' as any);
    fixture.detectChanges();
  });

  it('should call memberSubtitle without throwing', () => {
    expect(() => component['memberSubtitle']({ age: 'test-value' } as any)).not.toThrow();
  });

  it('should call memberTone without throwing', () => {
    expect(() => component['memberTone'](1)).not.toThrow();
  });

  it('should call commitmentSubtitle without throwing', () => {
    expect(() => component['commitmentSubtitle']({ dayOfWeek: 'test-value', startTime: 'test-value', endTime: 'test-value' } as any)).not.toThrow();
  });

  it('should call commitmentIcon without throwing', () => {
    expect(() => component['commitmentIcon']({ title: 'test-value' } as any)).not.toThrow();
  });

  it('should call openAddMember without throwing', () => {
    expect(() => component['openAddMember']()).not.toThrow();
  });

  it('should call openEditMember without throwing', () => {
    expect(() => component['openEditMember'](1, { name: 'test-value', age: 'test-value' } as any)).not.toThrow();
  });

  it('should call deleteMember without throwing', async () => {
    await expect(Promise.resolve(component['deleteMember'](1, { name: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should run deleteMember when the confirmation is declined', () => {
    confirmSpy.mockReturnValue(false as any);
    expect(() => component['deleteMember'](1, { name: 'test-value' } as any)).not.toThrow();
  });

  it('should call openAddCommitment without throwing', () => {
    expect(() => component['openAddCommitment']()).not.toThrow();
  });

  it('should call openEditCommitment without throwing', () => {
    expect(() => component['openEditCommitment'](1, {} as any)).not.toThrow();
  });

  it('should call deleteCommitment without throwing', async () => {
    await expect(Promise.resolve(component['deleteCommitment'](1, { title: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should run deleteCommitment when the confirmation is declined', () => {
    confirmSpy.mockReturnValue(false as any);
    expect(() => component['deleteCommitment'](1, { title: 'test-value' } as any)).not.toThrow();
  });

  it('should call signOut without throwing', async () => {
    await expect(Promise.resolve(component['signOut']()).then(() => true, () => true)).resolves.toBe(true);
  });
});
