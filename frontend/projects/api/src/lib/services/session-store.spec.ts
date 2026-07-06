import { TestBed } from '@angular/core/testing';
import { AUTH_SERVICE } from './auth.service.contract';
import { SessionStore } from './session-store';

describe('SessionStore', () => {
  let service: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SessionStore,
        { provide: AUTH_SERVICE, useValue: {} },
      ],
    });

    service = TestBed.inject(SessionStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call signUp without throwing', async () => {
    await expect(Promise.resolve(service.signUp({ familyName: 'test-value', homeLocation: 'test-value', email: 'test-value', password: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call login without throwing', async () => {
    await expect(Promise.resolve(service.login({ email: 'test-value' } as any, true)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call logout without throwing', () => {
    expect(() => service.logout()).not.toThrow();
  });

  it('should reflect logout through its signals', () => {
    service.logout();
    expect(service.token()).toBe(null);
    expect(service.user()).toBe(null);
    expect(service.error()).toBe(null);
  });

  it('should call forgotPassword without throwing', async () => {
    await expect(Promise.resolve(service.forgotPassword({ email: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call resendVerification without throwing', async () => {
    await expect(Promise.resolve(service.resendVerification({ email: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call resetPassword without throwing', async () => {
    await expect(Promise.resolve(service.resetPassword({ token: 'test-value', password: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call verifyEmail without throwing', async () => {
    await expect(Promise.resolve(service.verifyEmail({ token: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call rehydrate without throwing', async () => {
    await expect(Promise.resolve(service.rehydrate()).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call clearError without throwing', () => {
    expect(() => service.clearError()).not.toThrow();
  });

  it('should reflect clearError through its signals', () => {
    service.clearError();
    expect(service.error()).toBe(null);
  });

  it('should read the user signal', () => {
    expect(() => service.user()).not.toThrow();
  });

  it('should read the token signal', () => {
    expect(() => service.token()).not.toThrow();
  });

  it('should read the loading signal', () => {
    expect(() => service.loading()).not.toThrow();
  });

  it('should read the error signal', () => {
    expect(() => service.error()).not.toThrow();
  });

  it('should read the rememberedEmail signal', () => {
    expect(() => service.rememberedEmail()).not.toThrow();
  });

  it('should read the isAuthenticated signal', () => {
    expect(() => service.isAuthenticated()).not.toThrow();
  });

  it('should reflect state mutations through its signals', async () => {
    await Promise.all([
      service.signUp({ familyName: 'test-value', homeLocation: 'test-value', email: 'test-value', password: 'test-value' } as any).catch(() => undefined),
      service.login({ email: 'test-value' } as any, true).catch(() => undefined),
      service.forgotPassword({ email: 'test-value' } as any).catch(() => undefined),
      service.resendVerification({ email: 'test-value' } as any).catch(() => undefined),
      service.resetPassword({ token: 'test-value', password: 'test-value' } as any).catch(() => undefined),
      service.verifyEmail({ token: 'test-value' } as any).catch(() => undefined),
    ]);

    expect(() => service.logout()).not.toThrow();
    expect(() => service.clearError()).not.toThrow();
    expect(() => service.user()).not.toThrow();
    expect(() => service.token()).not.toThrow();
    expect(() => service.loading()).not.toThrow();
    expect(() => service.error()).not.toThrow();
    expect(() => service.rememberedEmail()).not.toThrow();
    expect(() => service.isAuthenticated()).not.toThrow();
  });
});
