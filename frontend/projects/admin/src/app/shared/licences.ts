import type { SelectOption } from 'components';

/** The fixed licence list (PRD Q2) plus "Other", which takes free text. */
export const LICENCE_OTHER = 'Other';

export const LICENCE_OPTIONS: readonly SelectOption[] = [
  { value: 'Saturdaze owned', label: 'Saturdaze owned' },
  { value: 'CC BY 4.0', label: 'CC BY 4.0' },
  { value: 'CC BY-SA 4.0', label: 'CC BY-SA 4.0' },
  { value: 'CC0', label: 'CC0' },
  { value: 'Provider terms', label: 'Provider terms' },
  { value: LICENCE_OTHER, label: 'Other' },
];

/** The select value for a stored licence: a listed one as is, anything else as "Other". */
export function licenceChoice(licence: string): string {
  return LICENCE_OPTIONS.some((o) => o.value === licence && o.value !== LICENCE_OTHER)
    ? licence
    : LICENCE_OTHER;
}
