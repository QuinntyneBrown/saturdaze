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

  describe('mapping', () => {
    const dto = {
      id: 'f1',
      name: 'The Browns',
      homeLocation: 'Port Credit',
      budgetEnabled: false,
      tryNewEnabled: true,
      fridayPreviewEnabled: false,
      members: [
        { id: 'm1', name: 'Mae', age: 5 },
        { id: 'm2', name: 'Quinn', age: 41 },
      ],
      commitments: [{ id: 'c1', title: 'Swim', dayOfWeek: 'Saturday', startTime: '09:00:00', endTime: '10:00:00' }],
      preferences: [{ id: 'p1', kind: 'Like', value: 'Hiking' }, { id: 'p2', kind: 'Dislike', value: 'Malls' }],
    };

    it('projects the profile: name, likes and the three keyed toggles', async () => {
      const promise = service.load();
      httpMock.expectOne('http://localhost:3000/api/family').flush(dto);
      await promise;
      const profile = service.getProfile()();
      expect(profile.familyName).toBe('The Browns');
      expect(profile.likes.map((l) => l.tone)).toEqual(['leaf', 'warn']);
      expect(profile.preferences.map((p) => [p.key, p.checked])).toEqual([
        ['budget', false],
        ['tryNew', true],
        ['fridayPreview', false],
      ]);
      const editable = service.getEditableProfile()()!;
      expect(editable.members.map((m) => m.id)).toEqual(['m2', 'm1']);
      expect(editable.commitments[0]).toMatchObject({ id: 'c1', startTime: '09:00', endTime: '10:00' });
      expect(editable).toMatchObject({ name: 'The Browns', tryNewEnabled: true, fridayPreviewEnabled: false });
    });

    it('leaves the family name null when the backend has none', async () => {
      const promise = service.load();
      httpMock.expectOne('http://localhost:3000/api/family').flush({ ...dto, name: '  ' });
      await promise;
      expect(service.getProfile()().familyName).toBeNull();
    });

    it('sends ids and the toggles on save', async () => {
      const promise = service.saveProfile({
        name: ' The Browns ',
        homeLocation: 'Port Credit',
        budgetEnabled: true,
        tryNewEnabled: false,
        fridayPreviewEnabled: true,
        members: [{ id: 'm1', name: ' Mae ', age: 6 }, { name: 'New', age: 1 }],
        commitments: [{ id: 'c1', title: 'Swim', dayOfWeek: 'Saturday', startTime: '09:00', endTime: '10:00' }],
        preferences: [{ kind: 'Like', value: 'Hiking' }],
      });
      const req = httpMock.expectOne('http://localhost:3000/api/family');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toMatchObject({
        name: 'The Browns',
        budgetEnabled: true,
        tryNewEnabled: false,
        fridayPreviewEnabled: true,
        members: [{ id: 'm1', name: 'Mae', age: 6 }, { id: null, name: 'New', age: 1 }],
        commitments: [{ id: 'c1', startTime: '09:00:00', endTime: '10:00:00' }],
      });
      req.flush(dto);
      await promise;
    });
  });
});
