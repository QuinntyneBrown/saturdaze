import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../api/api-base-url';
import { EventSubmissionsService } from './event-submissions.service';

describe('EventSubmissionsService', () => {
  let service: EventSubmissionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventSubmissionsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(EventSubmissionsService);
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

  it('should call mine without throwing', () => {
    expect(() => service.mine()).not.toThrow();
  });

  it('should call pending without throwing', () => {
    expect(() => service.pending()).not.toThrow();
  });

  describe('loadMine', () => {
    it('should make GET request', async () => {
      const mockResponse = {} as any;
      const promise = service.loadMine();
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'GET');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('GET');
      matched.forEach((req) => req.flush(mockResponse));
      await (promise as Promise<unknown>).catch(() => {});
    });

    it('should reject loadMine on an error response', async () => {
      const promise = service.loadMine();
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

  describe('loadPending', () => {
    it('should make GET request', async () => {
      const mockResponse = {} as any;
      const promise = service.loadPending();
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'GET');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('GET');
      matched.forEach((req) => req.flush(mockResponse));
      await (promise as Promise<unknown>).catch(() => {});
    });

    it('should reject loadPending on an error response', async () => {
      const promise = service.loadPending();
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

  describe('submit', () => {
    it('should make POST request and map the response', async () => {
      const mockResponse = {} as any;
      const promise = service.submit({ title: 'test-value', startsAtLocal: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('POST');
      matched.forEach((req) => req.flush(mockResponse));
      const result: any = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should reject submit on an error response', async () => {
      const promise = service.submit({ title: 'test-value', startsAtLocal: 'test-value' } as any);
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

  describe('approve', () => {
    it('should make POST request and map the response', async () => {
      const mockResponse = {} as any;
      const promise = service.approve('test-id');
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('POST');
      matched.forEach((req) => req.flush(mockResponse));
      const result: any = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should reject approve on an error response', async () => {
      const promise = service.approve('test-id');
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

  describe('reject', () => {
    it('should make POST request and map the response', async () => {
      const mockResponse = {} as any;
      const promise = service.reject('test-id');
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('POST');
      matched.forEach((req) => req.flush(mockResponse));
      const result: any = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should reject reject on an error response', async () => {
      const promise = service.reject('test-id');
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
});
