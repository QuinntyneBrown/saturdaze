import type { ThemeOverride } from '../types';

/**
 * Reduced motion zeroes the duration tokens instead of every animation
 * (L2-131): transitions, the dialog rise and the skeleton shimmer become
 * instant, while `durationSpin` is kept so a spinner, which reports status,
 * keeps turning. 0.01ms rather than 0 keeps `transitionend` and
 * `animationend` firing for scripts that wait on them.
 */
export const reducedMotionOverride: ThemeOverride = {
  media: '(prefers-reduced-motion: reduce)',
  tokens: {
    durationFast: '0.01ms',
    durationNormal: '0.01ms',
    durationShimmer: '0.01ms',
  },
};
