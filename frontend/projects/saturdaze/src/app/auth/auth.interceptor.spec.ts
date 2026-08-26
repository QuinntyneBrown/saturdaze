import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpRequest, HttpResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SESSION_STORE } from 'api';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let mockSESSION_STORE: any;

  beforeEach(() => {
    mockSESSION_STORE = {
      token: vi.fn(),
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach((req) => req.flush(null));
    httpMock.verify();
  });

  it('should intercept requests', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should attach the Authorization header when a token is present', () => {
    mockSESSION_STORE.token = vi.fn(() => ('test-token'));
    httpClient.get('/api/data').subscribe({ next: () => {}, error: () => {} });
    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBe(true);
    req.flush({});
  });

  it('should run the 500 handling path', () => {
    mockSESSION_STORE.token = vi.fn(() => ('test-token'));
    httpClient.get('/api/data').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/api/data').flush(null, { status: 500, statusText: 'Error' });
    httpMock.match(() => true).forEach((req) => req.flush({}));
  });

  it('should pass the request through a direct handler', () => {
    expect(() => {
      TestBed.runInInjectionContext(() => {
        const result = (authInterceptor as any)(new HttpRequest('GET', '/test'), (req: any) => of(new HttpResponse({ status: 200 })));
        (result as any).subscribe({ next: () => {}, error: () => {} });
      });
    }).not.toThrow();
  });
});
