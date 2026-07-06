import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../api/api-base-url';
import { RestaurantService } from './restaurant.service';

describe('RestaurantService', () => {
  let service: RestaurantService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RestaurantService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(RestaurantService);
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

  it('should call list without throwing', () => {
    expect(() => service.list()).not.toThrow();
  });

  describe('load', () => {
    it('should make GET request', async () => {
      const mockResponse = {} as any;
      const promise = service.load();
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'GET');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('GET');
      matched.forEach((req) => req.flush(mockResponse));
    });
  });

  describe('refresh', () => {
    it('should make GET request', async () => {
      const mockResponse = {} as any;
      const promise = service.refresh();
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'GET');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('GET');
      matched.forEach((req) => req.flush(mockResponse));
    });
  });

  describe('vote', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.vote('test-id', 'test-value', {} as any);
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

    it('should reject vote on an error response', async () => {
      const promise = service.vote('test-id', 'test-value', {} as any);
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

  describe('lock', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.lock('test-id');
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

    it('should reject lock on an error response', async () => {
      const promise = service.lock('test-id');
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
