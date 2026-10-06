import { loadScenarios } from './load-scenarios';
import { render } from './renderer';
import * as scenarioModules from './scenarios';

render(loadScenarios(scenarioModules)).catch((err) => console.error(err));
