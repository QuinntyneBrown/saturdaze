/**
 * Domain types for the Saturdaze weekend planner.
 *
 * Static skeleton-grade shapes. Each phase that needs a richer type adds
 * fields here; static page data drives consumers until Phase 12 swaps the
 * services to real HTTP fetches.
 */

export interface WeatherDay {
  /** Day label as the user sees it (e.g. "Saturday"). */
  readonly day: string;
  /** Icon name from the `sd-icon` set (`sun`, `cloud`, `rain`, ...). */
  readonly icon: string;
  /** High temperature, °C, as a plain string for the chip. */
  readonly hi: string;
  /** Low temperature, °C, as a plain string. */
  readonly lo: string;
  /** Free-form note shown beneath the temperatures. */
  readonly note: string;
}

export interface DaySummary {
  readonly day: string;
  readonly date: string;
  readonly weather: string;
  readonly icon: string;
  readonly highlight: string;
  readonly chips: readonly DayChip[];
}

export interface DayChip {
  readonly tone: 'default' | 'sun' | 'sky' | 'leaf' | 'indoor' | 'warn' | 'accent' | 'primary';
  readonly icon?: string;
  readonly label: string;
}

export interface AnticipationTip {
  readonly icon: string;
  readonly headline: string;
  readonly body: string;
  readonly cta?: string;
}

export interface QuickAction {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly href?: string;
}

/** The home-screen aggregate. */
export interface WeekendOverview {
  readonly greeting: string;
  readonly heroSubtitle: string;
  readonly heroCta: string;
  readonly forecastSubtitle: string;
  readonly forecast: readonly WeatherDay[];
  readonly days: readonly DaySummary[];
  readonly anticipations: readonly AnticipationTip[];
  readonly quickActions: readonly QuickAction[];
  readonly preview: readonly Block[];
}

/**
 * One block in a day's timeline. The full feature set is used from Phase 2
 * onward; Phase 1 only needs the preview-friendly subset, so optional
 * fields stay optional.
 */
export interface Block {
  readonly time: string;
  readonly duration?: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly icon: string;
  readonly tone?:
    | 'default'
    | 'meal'
    | 'drive'
    | 'workout'
    | 'fixed'
    | 'downtime'
    | 'indoor';
  readonly locked?: boolean;
  readonly drive?: string;
  readonly chips?: readonly DayChip[];
}

/** A day option in the itinerary's master pane day-switcher. */
export interface DayOption {
  readonly key: 'saturday' | 'sunday';
  readonly label: string;
  readonly icon: string;
  readonly iconTone: 'sun' | 'soft';
  readonly meta: string;
  readonly active: boolean;
}

/** A single stat tile in the weekend-totals grid. */
export interface WeekendStat {
  readonly num: string;
  readonly label: string;
}

/** A header chip describing the active day. */
export interface DayHeaderChip {
  readonly tone: 'sun' | 'sky' | 'leaf' | 'accent' | 'primary' | 'indoor' | 'warn' | 'default';
  readonly icon?: string;
  readonly label: string;
}

/** Aggregate view powering the itinerary page. */
export interface ItineraryView {
  readonly day: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly chips: readonly DayHeaderChip[];
  readonly dayOptions: readonly DayOption[];
  readonly stats: readonly WeekendStat[];
  readonly previewTitle: string;
  readonly previewSubtitle: string;
  readonly blocks: readonly Block[];
}

/** A full day in the weekend plan. */
export interface Day {
  readonly date: string;
  readonly weather: WeatherDay;
  readonly blocks: readonly Block[];
}

/** Whole-weekend aggregate (Sat + Sun + totals). */
export interface WeekendPlan {
  readonly saturday: Day;
  readonly sunday: Day;
  readonly totals: readonly WeekendStat[];
}
