import { ContentTheme, PlanningRows, PlanningSettings } from '../models/planning-settings';

/**
 * The choices D35, D36 and D37 offer, and the value line each "How you plan"
 * row shows (L2-197). The dialogs and the Family page read the same labels.
 */

export interface PlanningOption<T> {
  readonly value: T;
  readonly label: string;
}

/** D35: 30 min to 3 h, each way. */
export const MAX_DRIVE_OPTIONS: readonly PlanningOption<number>[] = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 h' },
  { value: 90, label: '1 h 30' },
  { value: 120, label: '2 h' },
  { value: 180, label: '3 h' },
];

/** D36 "We don't celebrate". */
export const OBSERVANCES: readonly PlanningOption<ContentTheme>[] = [
  { value: 'halloween', label: 'Halloween' },
  { value: 'christmas', label: 'Christmas' },
  { value: 'easter', label: 'Easter' },
  { value: 'valentines', label: "Valentine's Day" },
];

/** D36 "Leave out". */
export const LEAVE_OUT: readonly PlanningOption<ContentTheme>[] = [
  { value: 'alcohol', label: 'Alcohol-focused' },
  { value: 'horror', label: 'Scary or horror' },
];

/** D37 "Day starts": 7:00 to 11:00 by the half hour. */
export const DAY_START_OPTIONS: readonly PlanningOption<string>[] = halfHours(7, 11);

/** D37 "Youngest's bedtime": no set time, or 18:00 to 22:00 by the half hour. */
export const BEDTIME_OPTIONS: readonly PlanningOption<string | null>[] = [
  { value: null, label: 'No set time' },
  ...halfHours(18, 22),
];

/** The defaults a family that never set its boundaries plans with (L2-191). */
export const DEFAULT_PLANNING: PlanningSettings = {
  maxDriveMinutes: 120,
  excludedThemes: [],
  quietSunday: false,
  dayStart: '09:00',
  youngestBedtime: null,
  sundayDinnerAtHome: true,
  outingsPerDay: 2,
  leaning: 'Either',
};

function halfHours(from: number, to: number): PlanningOption<string>[] {
  const options: PlanningOption<string>[] = [];
  for (let h = from; h <= to; h++) {
    for (const m of ['00', '30']) {
      if (h === to && m === '30') break;
      const value = `${String(h).padStart(2, '0')}:${m}`;
      options.push({ value, label: value });
    }
  }
  return options;
}

/** "2 h", "1 h 30", "45 min" — the D35 label, or the nearest phrasing for other stored values. */
export function driveLabel(minutes: number): string {
  const option = MAX_DRIVE_OPTIONS.find((o) => o.value === minutes);
  if (option) return option.label;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

/** "9:00" from "09:00" or "09:00:00". */
export function clockLabel(time: string): string {
  const [h, m] = time.split(':');
  return `${Number(h)}:${m}`;
}

export function planningRows(s: PlanningSettings): PlanningRows {
  const labels = [...OBSERVANCES, ...LEAVE_OUT]
    .filter((o) => s.excludedThemes.includes(o.value))
    .map((o) => o.label);
  const themes = labels.length ? `Not ${labels.join(', ')}` : 'Everything';
  const n = s.outingsPerDay;
  return {
    maxDrive: `Up to ${driveLabel(s.maxDriveMinutes)} each way`,
    celebrate: s.quietSunday ? `${themes} · quiet Sunday` : themes,
    dayShape: `Starts ${clockLabel(s.dayStart)} · ${n} outing${n === 1 ? '' : 's'} a day`,
  };
}
