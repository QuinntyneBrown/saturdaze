/**
 * Calendar Feed Status — whether the family has a subscription link. The link
 * itself is shown once, when it is created, and never again (L2-171).
 */
export interface CalendarFeedStatus {
  /**
   * Active.
   */
  readonly active: boolean;
  /**
   * Created Utc — ISO timestamp; null when there is no link.
   */
  readonly createdUtc: string | null;
}

/**
 * Calendar Settings — `GET /api/calendar`: what the Family page's Calendar
 * section draws (L2-166, L2-172).
 */
export interface CalendarSettings {
  /**
   * Google Configured — false hides the "Connect Google Calendar" row.
   */
  readonly googleConfigured: boolean;
  /**
   * Feed — the family's subscription link.
   */
  readonly feed: CalendarFeedStatus;
}

/**
 * Calendar Feed Link — `POST /api/calendar/feed` (201): the only response that
 * carries the link.
 */
export interface CalendarFeedLink {
  /**
   * Url — `https://…/api/calendar/feed/{token}.ics`.
   */
  readonly url: string;
  /**
   * Webcal Url — the same with the `webcal` scheme; what D33 shows.
   */
  readonly webcalUrl: string;
  /**
   * Created Utc.
   */
  readonly createdUtc: string;
}
