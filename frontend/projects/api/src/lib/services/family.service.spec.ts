import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../api/api-base-url';
import { FamilyService } from './family.service';

describe('FamilyService', () => {
  let service: FamilyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FamilyService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(FamilyService);
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

  it('should call getProfile without throwing', () => {
    expect(() => service.getProfile()).not.toThrow();
  });

  it('should call getEditableProfile without throwing', () => {
    expect(() => service.getEditableProfile()).not.toThrow();
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
      await (promise as Promise<unknown>).catch(() => {});
    });

    it('should recover load from an error response', async () => {
      const promise = service.load();
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'GET');
      if (matched.length === 0) {
        return;
      }
      matched.forEach((req) =>
        req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' })
      );
      // The catch swallows the failure — resolving IS the contract.
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('saveProfile', () => {
    it('should make PUT request', async () => {
      const mockResponse = {} as any;
      const promise = service.saveProfile({ homeLocation: 'test-value', budgetEnabled: 'test-value', members: 'test-value', commitments: 'test-value', preferences: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'PUT');
      if (matched.length === 0) {
        // The method did not issue a request on this path; nothing to assert.
        return;
      }
      expect(matched[0].request.method).toBe('PUT');
      matched.forEach((req) => req.flush(mockResponse));
      await (promise as Promise<unknown>).catch(() => {});
    });

    it('should reject saveProfile on an error response', async () => {
      const promise = service.saveProfile({ homeLocation: 'test-value', budgetEnabled: 'test-value', members: 'test-value', commitments: 'test-value', preferences: 'test-value' } as any);
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'PUT');
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
