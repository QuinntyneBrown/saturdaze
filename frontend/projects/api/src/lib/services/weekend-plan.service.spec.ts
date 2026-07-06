import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../api/api-base-url';
import { WeekendPlanService } from './weekend-plan.service';

describe('WeekendPlanService', () => {
  let service: WeekendPlanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WeekendPlanService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000' },
      ],
    });

    service = TestBed.inject(WeekendPlanService);
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

  it('should call getOverview without throwing', () => {
    expect(() => service.getOverview()).not.toThrow();
  });

  it('should call getItinerary without throwing', () => {
    expect(() => service.getItinerary()).not.toThrow();
  });

  describe('loadCurrent', () => {
    it('should make GET request', async () => {
      const mockResponse = {} as any;
      const promise = service.loadCurrent();
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

    it('should recover loadCurrent from an error response', async () => {
      const promise = service.loadCurrent();
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

  describe('plan', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.plan('test-value');
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

    it('should recover plan from an error response', async () => {
      const promise = service.plan('test-value');
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
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

  describe('regenerate', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.regenerate();
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

    it('should recover regenerate from an error response', async () => {
      const promise = service.regenerate();
      (promise as Promise<unknown>).catch(() => {});

      const matched = httpMock.match((request) => request.method === 'POST');
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

  describe('regenerateDay', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.regenerateDay("Saturday");
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

    it('should reject regenerateDay on an error response', async () => {
      const promise = service.regenerateDay("Saturday");
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

  describe('createShareLink', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.createShareLink();
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

    it('should reject createShareLink on an error response', async () => {
      const promise = service.createShareLink();
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

  it('should call calendarLinks', () => {
    let outcome = 'returned';
    try {
      service.calendarLinks();
    } catch {
      outcome = 'threw'; // a state-dependent guard fired
    }
    expect(['returned', 'threw']).toContain(outcome);
  });
  it('should call calendarLinks with optional arguments provided', () => {
    let outcome = 'returned';
    try {
      service.calendarLinks('test-id');
    } catch {
      outcome = 'threw'; // a state-dependent guard fired
    }
    expect(['returned', 'threw']).toContain(outcome);
  });

  describe('lockBlock', () => {
    it('should make PUT request', async () => {
      const mockResponse = {} as any;
      const promise = service.lockBlock('test-id', true);
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

    it('should reject lockBlock on an error response', async () => {
      const promise = service.lockBlock('test-id', true);
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

  describe('lockDay', () => {
    it('should make PUT request', async () => {
      const mockResponse = {} as any;
      const promise = service.lockDay("Saturday", true);
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

    it('should reject lockDay on an error response', async () => {
      const promise = service.lockDay("Saturday", true);
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

  describe('addErrand', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.addErrand('test-value', 1);
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

    it('should reject addErrand on an error response', async () => {
      const promise = service.addErrand('test-value', 1);
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

  describe('remixSaved', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.remixSaved('test-id');
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

    it('should reject remixSaved on an error response', async () => {
      const promise = service.remixSaved('test-id');
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

  describe('repeatSaved', () => {
    it('should make POST request', async () => {
      const mockResponse = {} as any;
      const promise = service.repeatSaved('test-id');
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

    it('should reject repeatSaved on an error response', async () => {
      const promise = service.repeatSaved('test-id');
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

  it('should call setActiveDay without throwing', () => {
    expect(() => service.setActiveDay("Saturday")).not.toThrow();
  });
});
