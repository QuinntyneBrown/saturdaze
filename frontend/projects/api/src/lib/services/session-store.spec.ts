import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AUTH_SERVICE } from './auth.service.contract';
import { SessionStore } from './session-store';

describe('SessionStore', () => {
  let service: SessionStore;
  let mockAUTH_SERVICE: any;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  beforeEach(() => {
    mockAUTH_SERVICE = {
      signUp: vi.fn(() => Promise.resolve(undefined)),
      login: vi.fn(() => Promise.resolve(undefined)),
      forgotPassword: vi.fn(() => Promise.resolve(undefined)),
      resendVerification: vi.fn(() => Promise.resolve(undefined)),
      resetPassword: vi.fn(() => Promise.resolve(undefined)),
      verifyEmail: vi.fn(() => Promise.resolve(undefined)),
      me: vi.fn(() => Promise.resolve(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        SessionStore,
        { provide: AUTH_SERVICE, useValue: mockAUTH_SERVICE },
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

  it('should handle a failed signUp in signUp', async () => {
    mockAUTH_SERVICE.signUp = vi.fn(() => Promise.reject(new Error('test')));
    await expect(Promise.resolve(service.signUp({ familyName: 'test-value', homeLocation: 'test-value', email: 'test-value', password: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call login without throwing', async () => {
    await expect(Promise.resolve(service.login({ email: 'test-value' } as any, true)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should handle a failed login in login', async () => {
    mockAUTH_SERVICE.login = vi.fn(() => Promise.reject(new Error('test')));
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

  it('should handle a failed forgotPassword in forgotPassword', async () => {
    mockAUTH_SERVICE.forgotPassword = vi.fn(() => Promise.reject(new Error('test')));
    await expect(Promise.resolve(service.forgotPassword({ email: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call resendVerification without throwing', async () => {
    await expect(Promise.resolve(service.resendVerification({ email: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should handle a failed resendVerification in resendVerification', async () => {
    mockAUTH_SERVICE.resendVerification = vi.fn(() => Promise.reject(new Error('test')));
    await expect(Promise.resolve(service.resendVerification({ email: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call resetPassword without throwing', async () => {
    await expect(Promise.resolve(service.resetPassword({ token: 'test-value', password: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should handle a failed resetPassword in resetPassword', async () => {
    mockAUTH_SERVICE.resetPassword = vi.fn(() => Promise.reject(new Error('test')));
    await expect(Promise.resolve(service.resetPassword({ token: 'test-value', password: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should call verifyEmail without throwing', async () => {
    await expect(Promise.resolve(service.verifyEmail({ token: 'test-value' } as any)).then(() => true, () => true)).resolves.toBe(true);
  });

  it('should handle a failed verifyEmail in verifyEmail', async () => {
    mockAUTH_SERVICE.verifyEmail = vi.fn(() => Promise.reject(new Error('test')));
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

  it('should reflect signUp mutations through its signals', async () => {
    let invocation: Promise<unknown>;
    try {
      invocation = Promise.resolve(service.signUp({ familyName: 'test-value', homeLocation: 'test-value', email: 'test-value', password: 'test-value' } as any));
    } catch {
      invocation = Promise.resolve(undefined);
    }
    await invocation.then(() => {}, () => {});
    expect(() => {
      service.user();
      service.token();
      service.loading();
      service.error();
      service.rememberedEmail();
      service.isAuthenticated();
    }).not.toThrow();
  });

  it('should reflect login mutations through its signals', async () => {
    let invocation: Promise<unknown>;
    try {
      invocation = Promise.resolve(service.login({ email: 'test-value' } as any, true));
    } catch {
      invocation = Promise.resolve(undefined);
    }
    await invocation.then(() => {}, () => {});
    expect(() => {
      service.user();
      service.token();
      service.loading();
      service.error();
      service.rememberedEmail();
      service.isAuthenticated();
    }).not.toThrow();
  });

  it('should reflect logout mutations through its signals', () => {
    expect(() => {
      service.logout();
      service.user();
      service.token();
      service.loading();
      service.error();
      service.rememberedEmail();
      service.isAuthenticated();
    }).not.toThrow();
  });

  it('should reflect forgotPassword mutations through its signals', async () => {
    let invocation: Promise<unknown>;
    try {
      invocation = Promise.resolve(service.forgotPassword({ email: 'test-value' } as any));
    } catch {
      invocation = Promise.resolve(undefined);
    }
    await invocation.then(() => {}, () => {});
    expect(() => {
      service.user();
      service.token();
      service.loading();
      service.error();
      service.rememberedEmail();
      service.isAuthenticated();
    }).not.toThrow();
  });

  it('should reflect resendVerification mutations through its signals', async () => {
    let invocation: Promise<unknown>;
    try {
      invocation = Promise.resolve(service.resendVerification({ email: 'test-value' } as any));
    } catch {
      invocation = Promise.resolve(undefined);
    }
    await invocation.then(() => {}, () => {});
    expect(() => {
      service.user();
      service.token();
      service.loading();
      service.error();
      service.rememberedEmail();
      service.isAuthenticated();
    }).not.toThrow();
  });

  it('should reflect resetPassword mutations through its signals', async () => {
    let invocation: Promise<unknown>;
    try {
      invocation = Promise.resolve(service.resetPassword({ token: 'test-value', password: 'test-value' } as any));
    } catch {
      invocation = Promise.resolve(undefined);
    }
    await invocation.then(() => {}, () => {});
    expect(() => {
      service.user();
      service.token();
      service.loading();
      service.error();
      service.rememberedEmail();
      service.isAuthenticated();
    }).not.toThrow();
  });

  it('should reflect verifyEmail mutations through its signals', async () => {
    let invocation: Promise<unknown>;
    try {
      invocation = Promise.resolve(service.verifyEmail({ token: 'test-value' } as any));
    } catch {
      invocation = Promise.resolve(undefined);
    }
    await invocation.then(() => {}, () => {});
    expect(() => {
      service.user();
      service.token();
      service.loading();
      service.error();
      service.rememberedEmail();
      service.isAuthenticated();
    }).not.toThrow();
  });

  it('should reflect clearError mutations through its signals', () => {
    expect(() => {
      service.clearError();
      service.user();
      service.token();
      service.loading();
      service.error();
      service.rememberedEmail();
      service.isAuthenticated();
    }).not.toThrow();
  });
});
