/**
 * Calendar Export — what the "Add to calendar" dialog needs. The file name is
 * cosmetic: the API is cross-origin, so the server's Content-Disposition wins.
 */
export interface CalendarExport {
  /**
   * Ics Url.
   */
  readonly icsUrl: string;
  /**
   * File Name — "weekend-17-may.ics".
   */
  readonly fileName: string;
  /**
   * Event Count — one calendar event per block.
   */
  readonly eventCount: number;
}
