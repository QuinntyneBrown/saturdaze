import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CALENDAR_SERVICE } from 'api';
import { StatusRow } from 'components';

/**
 * `/family/calendar/google` — where Google sends the browser back after its
 * consent screen (ADR-021, decision 1). With `code` and `state` it finishes the
 * connection and returns to Family; with `error` (consent denied) or a refused
 * code it returns to Family with the "not connected" note (L2-173 AC4, AC5).
 */
@Component({
  selector: 'app-google-calendar-callback',
  standalone: true,
  imports: [StatusRow],
  template: `<sd-status-row icon="calendar">Connecting Google Calendar.</sd-status-row>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleCalendarCallbackPage {
  private readonly calendar = inject(CALENDAR_SERVICE);
  private readonly router = inject(Router);

  constructor() {
    const query = inject(ActivatedRoute).snapshot.queryParamMap;
    void this.finish(query.get('code'), query.get('state'), query.get('error'));
  }

  private async finish(
    code: string | null,
    state: string | null,
    error: string | null,
  ): Promise<void> {
    let connected = false;
    if (code && state && !error) {
      try {
        await this.calendar.connectGoogle(code, state);
        connected = true;
      } catch {
        connected = false;
      }
    }
    await this.router.navigate(['/family'], {
      queryParams: connected ? {} : { calendar: 'denied' },
      replaceUrl: true,
    });
  }
}
