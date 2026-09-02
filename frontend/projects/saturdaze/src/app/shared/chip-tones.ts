import type { ChipTone as ApiChipTone } from 'api';
import type { ChipTone, FilterChipTone } from 'components';

const FILTER_TONES: readonly FilterChipTone[] = ['default', 'leaf', 'indoor', 'sky', 'sun', 'accent', 'primary'];

/** The api's chip tones onto `sd-chip` ("neutral" is the plain chip). */
export function chipTone(tone: ApiChipTone): ChipTone {
  return tone === 'neutral' ? 'default' : tone;
}

/** The api's chip tones onto `sd-filter-chip`, which has no warn tone. */
export function filterTone(tone: ApiChipTone): FilterChipTone {
  return (FILTER_TONES as readonly string[]).includes(tone) ? (tone as FilterChipTone) : 'default';
}
