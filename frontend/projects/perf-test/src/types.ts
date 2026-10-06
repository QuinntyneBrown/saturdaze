import type { Type } from '@angular/core';

/**
 * A scenario module: its default export is the component rendered once per
 * iteration; an optional `decorator` export wraps all iterations once
 * (a theme, a list container), like the decorator in Fluent's perf-test.
 */
export interface ScenarioModule {
  default: Type<unknown>;
  decorator?: Type<unknown>;
}

export interface Scenario {
  component: Type<unknown>;
  decorator?: Type<unknown>;
}

export type Scenarios = Record<string, Scenario>;

/**
 * - `mount` (default): one render of `iterations` instances side by side.
 * - `virtual-rerender`: one instance, change-detected `iterations` times.
 * - `virtual-rerender-with-unmount`: one instance created, rendered and
 *   destroyed `iterations` times.
 */
export type RenderType = 'mount' | 'virtual-rerender' | 'virtual-rerender-with-unmount';
