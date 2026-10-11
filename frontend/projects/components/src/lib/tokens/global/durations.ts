import type { DurationTokens } from '../types';

/**
 * Fast for hover and press feedback, normal for state changes (a day locking,
 * a dialog opening), shimmer for one skeleton sweep and spin for one spinner
 * turn. Under reduced motion all but spin drop to 0.01ms (`reducedMotionOverride`).
 */
export const durations: DurationTokens = {
  durationFast: '120ms',
  durationNormal: '220ms',
  durationShimmer: '1400ms',
  durationSpin: '900ms',
};
