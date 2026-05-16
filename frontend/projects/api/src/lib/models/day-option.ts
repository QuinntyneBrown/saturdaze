/** A day option in the itinerary's master pane day-switcher. */
export interface DayOption {
  readonly key: 'saturday' | 'sunday';
  readonly label: string;
  readonly icon: string;
  readonly iconTone: 'sun' | 'soft';
  readonly meta: string;
  readonly active: boolean;
}
