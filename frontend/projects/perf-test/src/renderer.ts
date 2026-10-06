import {
  type ApplicationRef,
  type ComponentRef,
  createComponent,
  provideZonelessChangeDetection,
} from '@angular/core';
import { createApplication } from '@angular/platform-browser';

import type { RenderType, Scenario, Scenarios } from './types';

const RENDER_DONE_ID = 'render-done';
const RENDER_MEASURE = 'sd-perf:render';
const DEFAULT_ITERATIONS = 10;

/**
 * The Angular port of Fluent's perf-test renderer: reads
 * `?scenario=&iterations=&renderType=`, renders the scenario, then appends
 * `#render-done`. The runner profiles the page until that marker appears;
 * the marker's data attributes carry the measured render time.
 */
export async function render(scenarios: Scenarios): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('scenario') ?? Object.keys(scenarios)[0];
  const iterations = Number(params.get('iterations') ?? DEFAULT_ITERATIONS);
  const renderType = (params.get('renderType') ?? 'mount') as RenderType;

  const root = document.createElement('div');
  document.body.appendChild(root);

  const marker = document.createElement('div');
  marker.id = RENDER_DONE_ID;
  Object.assign(marker.dataset, { scenario: name, iterations: String(iterations), renderType });

  const scenario = scenarios[name];
  if (!scenario) {
    marker.dataset['error'] = `Unknown scenario "${name}". Export it from src/scenarios/index.ts.`;
    document.body.appendChild(marker);
    return;
  }

  const app = await createApplication({ providers: [provideZonelessChangeDetection()] });

  performance.mark(`${RENDER_MEASURE}:start`);
  switch (renderType) {
    case 'virtual-rerender':
      rerender(app, scenario, root, iterations, false);
      break;
    case 'virtual-rerender-with-unmount':
      rerender(app, scenario, root, iterations, true);
      break;
    default:
      mount(app, scenario, root, iterations);
  }
  const { duration } = performance.measure(RENDER_MEASURE, `${RENDER_MEASURE}:start`);

  marker.dataset['duration'] = String(duration);
  document.body.appendChild(marker);
}

/** `iterations` instances, wrapped once in the decorator, in one change detection pass. */
function mount(app: ApplicationRef, scenario: Scenario, root: HTMLElement, iterations: number) {
  const environmentInjector = app.injector;
  const instances: ComponentRef<unknown>[] = [];
  for (let i = 0; i < iterations; i++) {
    instances.push(createComponent(scenario.component, { environmentInjector }));
  }
  const nodes = instances.map((ref) => ref.location.nativeElement as Node);

  if (scenario.decorator) {
    const decorator = createComponent(scenario.decorator, {
      environmentInjector,
      hostElement: root,
      projectableNodes: [nodes],
    });
    app.attachView(decorator.hostView);
  } else {
    root.append(...nodes);
  }
  instances.forEach((ref) => app.attachView(ref.hostView));
  app.tick();
}

/** One instance, re-rendered `iterations` times; optionally destroyed and recreated each time. */
function rerender(
  app: ApplicationRef,
  scenario: Scenario,
  root: HTMLElement,
  iterations: number,
  unmount: boolean,
) {
  const environmentInjector = app.injector;
  // The decorator is created once; each re-render lands in a slot it projects.
  const slot = document.createElement('div');
  if (scenario.decorator) {
    const decorator = createComponent(scenario.decorator, {
      environmentInjector,
      hostElement: root,
      projectableNodes: [[slot]],
    });
    app.attachView(decorator.hostView);
    app.tick();
  } else {
    root.appendChild(slot);
  }

  let ref: ComponentRef<unknown> | null = null;
  for (let i = 0; i < iterations; i++) {
    if (!ref) {
      ref = createComponent(scenario.component, { environmentInjector });
      slot.appendChild(ref.location.nativeElement);
    }
    ref.changeDetectorRef.detectChanges();
    if (unmount && i < iterations - 1) {
      ref.destroy();
      ref = null;
    }
  }
}
