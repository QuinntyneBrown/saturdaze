/** A day option in the itinerary's master pane day-switcher. */
export interface DayOption {
  /**
   * Key.
   */
  readonly key: 'saturday' | 'sunday';
  /**
   * Label.
   */
  readonly label: string;
  /**
   * Icon.
   */
  readonly icon: string;
  /**
   * Icon Tone.
   */
  readonly iconTone: 'sun' | 'soft';
  /**
   * Meta.
   */
  readonly meta: string;
  /**
   * Active.
   */
  readonly active: boolean;
}
