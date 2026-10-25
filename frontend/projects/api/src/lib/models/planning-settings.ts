/**
 * Content Theme — the fixed vocabulary a family can leave out (L2-194).
 */
export type ContentTheme =
  | 'halloween'
  | 'christmas'
  | 'easter'
  | 'valentines'
  | 'alcohol'
  | 'horror';

/**
 * Plan Leaning — "Indoor or outdoor" in D37 (L2-196).
 */
export type PlanLeaning = 'Indoor' | 'Either' | 'Outdoor';

/**
 * Planning Settings — the family's "How you plan" boundaries (L2-191, L2-194, L2-195, L2-196).
 */
export interface PlanningSettings {
  /**
   * Max Drive Minutes — each way; nothing further is planned, listed or suggested.
   */
  readonly maxDriveMinutes: number;
  /**
   * Excluded Themes — "We don't celebrate" and "Leave out".
   */
  readonly excludedThemes: readonly ContentTheme[];
  /**
   * Quiet Sunday — worship and rest, one outing at most.
   */
  readonly quietSunday: boolean;
  /**
   * Day Start — "HH:mm".
   */
  readonly dayStart: string;
  /**
   * Youngest Bedtime — "HH:mm"; null when there is no set time.
   */
  readonly youngestBedtime: string | null;
  /**
   * Sunday Dinner At Home — no restaurant on Sunday evening.
   */
  readonly sundayDinnerAtHome: boolean;
  /**
   * Outings Per Day — 1 to 3.
   */
  readonly outingsPerDay: number;
  /**
   * Leaning.
   */
  readonly leaning: PlanLeaning;
}

/**
 * Planning Rows — the value line of each "How you plan" row on Family (L2-197).
 */
export interface PlanningRows {
  /**
   * Max Drive — "Up to 2 h each way".
   */
  readonly maxDrive: string;
  /**
   * Celebrate — "Not Halloween" / "Everything", plus " · quiet Sunday".
   */
  readonly celebrate: string;
  /**
   * Day Shape — "Starts 9:00 · 2 outings a day".
   */
  readonly dayShape: string;
}
