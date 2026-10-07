import type { ChipTone as ApiChipTone, ChipView } from 'api';
import type { ChipTone, PlaceRowFlag } from 'components';

/** The api's chip tones onto `sd-chip` ("neutral" is the plain chip). */
export function chipTone(tone: ApiChipTone): ChipTone {
  return tone === 'neutral' ? 'default' : tone;
}

/** The api's health chips as `sd-place-row` flags. */
export function placeRowFlags(chips: readonly ChipView[]): readonly PlaceRowFlag[] {
  return chips.map((chip) => ({ tone: chipTone(chip.tone), icon: chip.icon, label: chip.label }));
}
