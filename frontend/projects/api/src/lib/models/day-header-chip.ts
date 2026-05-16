/** A header chip describing the active day. */
export interface DayHeaderChip {
  readonly tone: 'sun' | 'sky' | 'leaf' | 'accent' | 'primary' | 'indoor' | 'warn' | 'default';
  readonly icon?: string;
  readonly label: string;
}
