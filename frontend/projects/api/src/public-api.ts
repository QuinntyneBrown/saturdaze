/*
 * Public API Surface of api
 *
 * Two kinds of exports live here:
 *
 *   1. CONTRACTS — interfaces + injection tokens (one pair per service).
 *      Pages and any future plugins should depend ONLY on these. They
 *      define WHAT a service does without committing to HOW.
 *
 *   2. IMPLEMENTATIONS — concrete classes that satisfy the contracts. The
 *      host application wires `{ provide: TOKEN, useExisting: ConcreteClass }`
 *      in its composition root; consumers never import the classes
 *      directly.
 *
 * Domain models live in `lib/models/` (one type per file, grouped behind
 * per-slice barrels). DTO files (`*.dto.ts`) are service-internal and not
 * re-exported.
 */

export * from './lib/api/api-base-url';

// Domain models
export * from './lib/models/activity';
export * from './lib/models/event';
export * from './lib/models/family';
export * from './lib/models/restaurant';
export * from './lib/models/saved';
export * from './lib/models/weekend';

// Service contracts (interface + InjectionToken)
export * from './lib/services/activity.service.contract';
export * from './lib/services/events.service.contract';
export * from './lib/services/family.service.contract';
export * from './lib/services/restaurant.service.contract';
export * from './lib/services/saved.service.contract';
export * from './lib/services/weekend-plan.service.contract';

// Concrete implementations (imported only by composition roots)
export * from './lib/services/activity.service';
export * from './lib/services/events.service';
export * from './lib/services/family.service';
export * from './lib/services/restaurant.service';
export * from './lib/services/saved.service';
export * from './lib/services/weekend-plan.service';
