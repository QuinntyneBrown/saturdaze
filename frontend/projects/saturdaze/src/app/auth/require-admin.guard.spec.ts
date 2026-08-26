import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, convertToParamMap, UrlTree } from '@angular/router';
import { SESSION_STORE } from 'api';
import { requireAdmin } from './require-admin.guard';

describe('requireAdmin', () => {
  let mockSESSION_STORE: any;
  let router: Router;

  beforeEach(() => {
    mockSESSION_STORE = {
      isAuthenticated: vi.fn(),
      user: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: SESSION_STORE, useValue: mockSESSION_STORE },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should be defined', () => {
    expect(requireAdmin).toBeDefined();
  });

  it('should execute without throwing', () => {
    const route = { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({}), params: {}, queryParams: {}, data: {}, url: [] } as any;
    expect(() => {
      TestBed.runInInjectionContext(() =>
        (requireAdmin as unknown as (...args: any[]) => unknown)(route, { url: '/test' } as any)
      );
    }).not.toThrow();
  });
});
