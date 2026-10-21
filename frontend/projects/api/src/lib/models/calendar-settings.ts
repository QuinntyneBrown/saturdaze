/**
 * Calendar Feed Status — whether the family has a subscription link. The link
 * itself is shown once, when it is created, and never again (L2-179).
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
 * Google Calendar Connection — the caller's own connection (L2-173). Never
 * carries the token.
 */
export interface GoogleCalendarConnection {
  /**
   * Email — the Google account the calendar belongs to.
   */
  readonly email: string;
  /**
   * Status — `needs_reconnect` once Google refuses the grant (L2-178).
   */
  readonly status: 'connected' | 'needs_reconnect';
  /**
   * Read Commitments — "Plan around my calendar".
   */
  readonly readCommitments: boolean;
  /**
   * Last Synced Utc — ISO timestamp of the last successful write; null before the first.
   */
  readonly lastSyncedUtc: string | null;
}

/**
 * Calendar Settings — `GET /api/calendar`: what the Family page's Calendar
 * section draws (L2-174, L2-180).
 */
export interface CalendarSettings {
  /**
   * Google Configured — false hides the "Connect Google Calendar" row.
   */
  readonly googleConfigured: boolean;
  /**
   * Google — the caller's connection, or null when not connected.
   */
  readonly google: GoogleCalendarConnection | null;
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
