import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, convertToParamMap, UrlTree } from '@angular/router';
import { SESSION_STORE } from 'api';
import { requireAnonymous } from './require-anonymous.guard';

describe('requireAnonymous', () => {
  let mockSESSION_STORE: any;
  let router: Router;

  beforeEach(() => {
    mockSESSION_STORE = {
      isAuthenticated: vi.fn(),
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
    expect(requireAnonymous).toBeDefined();
  });

  it('should execute without throwing', () => {
    const route = { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({}), params: {}, queryParams: {}, data: {}, url: [] } as any;
    expect(() => {
      TestBed.runInInjectionContext(() =>
        (requireAnonymous as unknown as (...args: any[]) => unknown)(route, { url: '/test' } as any)
      );
    }).not.toThrow();
  });

  it('should redirect when isAuthenticated is truthy', () => {
    mockSESSION_STORE.isAuthenticated = vi.fn(() => (true));
    const route = { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({}), params: {}, queryParams: {}, data: {}, url: [] } as any;
    const result = TestBed.runInInjectionContext(() =>
      (requireAnonymous as unknown as (...args: any[]) => unknown)(route, { url: '/test' } as any)
    );
    expect(result instanceof UrlTree).toBe(true);
  });

  it('should return true when isAuthenticated is falsy', () => {
    mockSESSION_STORE.isAuthenticated = vi.fn(() => (false));
    const route = { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({}), params: {}, queryParams: {}, data: {}, url: [] } as any;
    const result = TestBed.runInInjectionContext(() =>
      (requireAnonymous as unknown as (...args: any[]) => unknown)(route, { url: '/test' } as any)
    );
    expect(result).toBe(true);
  });
});
