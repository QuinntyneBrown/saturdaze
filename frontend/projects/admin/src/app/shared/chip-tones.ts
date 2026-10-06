import type { ChipTone as ApiChipTone } from 'api';
import type { ChipTone } from 'components';

/** The api's chip tones onto `sd-chip` ("neutral" is the plain chip). */
export function chipTone(tone: ApiChipTone): ChipTone {
  return tone === 'neutral' ? 'default' : tone;
}
