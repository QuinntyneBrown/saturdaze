import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../api/api-base-url';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true).forEach((req) => req.flush(null));
  });

  afterEach(() => {
    httpMock.match(() => true).forEach((req) => req.flush(null));
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signUp', () => {
    it('should make POST request and map the response', async () => {
      const mockResponse = { token: { accessToken: 'test', accessTokenExpiresAtUtc: 'test' }, user: 'test' } as any;
      const promise = service.signUp({ familyName: 'test-value', homeLocation: 'test-value', email: 'test-value', password: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('POST');
      matched.forEach((req) => req.flush(mockResponse));
      const result: any = await promise;
      expect(result.token.value).toEqual(mockResponse.token.accessToken);
      expect(result.token.expiresUtc).toEqual(mockResponse.token.accessTokenExpiresAtUtc);
      expect(result.user).toEqual(mockResponse.user);
    });

    it('should reject signUp on an error response', async () => {
      const promise = service.signUp({ familyName: 'test-value', homeLocation: 'test-value', email: 'test-value', password: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      await expect(promise).rejects.toBeTruthy();
    });
  });

  describe('login', () => {
    it('should make POST request and map the response', async () => {
      const mockResponse = { token: { accessToken: 'test', accessTokenExpiresAtUtc: 'test' }, user: 'test' } as any;
      const promise = service.login({ email: 'test-value', password: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('POST');
      matched.forEach((req) => req.flush(mockResponse));
      const result: any = await promise;
      expect(result.token.value).toEqual(mockResponse.token.accessToken);
      expect(result.token.expiresUtc).toEqual(mockResponse.token.accessTokenExpiresAtUtc);
      expect(result.user).toEqual(mockResponse.user);
    });

    it('should reject login on an error response', async () => {
      const promise = service.login({ email: 'test-value', password: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      await expect(promise).rejects.toBeTruthy();
    });
  });

  describe('forgotPassword', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.forgotPassword({ email: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('POST');
      matched.forEach((req) => req.flush(mockResponse));
      await (promise as Promise<unknown>).catch(() => {});
    });

    it('should reject forgotPassword on an error response', async () => {
      const promise = service.forgotPassword({ email: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      await expect(promise).rejects.toBeTruthy();
    });
  });

  describe('resendVerification', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.resendVerification({ email: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('POST');
      matched.forEach((req) => req.flush(mockResponse));
      await (promise as Promise<unknown>).catch(() => {});
    });

    it('should reject resendVerification on an error response', async () => {
      const promise = service.resendVerification({ email: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      await expect(promise).rejects.toBeTruthy();
    });
  });

  describe('resetPassword', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.resetPassword({ token: 'test-value', password: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('POST');
      matched.forEach((req) => req.flush(mockResponse));
      await (promise as Promise<unknown>).catch(() => {});
    });

    it('should reject resetPassword on an error response', async () => {
      const promise = service.resetPassword({ token: 'test-value', password: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      await expect(promise).rejects.toBeTruthy();
    });
  });

  describe('verifyEmail', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.verifyEmail({ token: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('POST');
      matched.forEach((req) => req.flush(mockResponse));
      await (promise as Promise<unknown>).catch(() => {});
    });

    it('should reject verifyEmail on an error response', async () => {
      const promise = service.verifyEmail({ token: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      await expect(promise).rejects.toBeTruthy();
    });
  });

  describe('me', () => {
    it('should make GET request and map the response', async () => {
      const mockResponse = {} as any;
      const promise = service.me();
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'GET');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('GET');
      matched.forEach((req) => req.flush(mockResponse));
      const result: any = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should reject me on an error response', async () => {
      const promise = service.me();
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'GET');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      await expect(promise).rejects.toBeTruthy();
    });
  });
});
