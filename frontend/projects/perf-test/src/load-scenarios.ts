import type { ScenarioModule, Scenarios } from './types';

/** Turns `import * as scenarios from './scenarios'` into a name → scenario map. */
export function loadScenarios(modules: Record<string, ScenarioModule>): Scenarios {
  const scenarios: Scenarios = {};
  for (const [name, module] of Object.entries(modules)) {
    scenarios[name] = { component: module.default, decorator: module.decorator };
  }
  return scenarios;
}
