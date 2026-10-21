import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import { CALENDAR_SERVICE } from 'api';

import { GoogleCalendarCallbackPage } from './google-calendar-callback.page';

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('GoogleCalendarCallbackPage', () => {
  let connectGoogle: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  async function land(query: Record<string, string>): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [GoogleCalendarCallbackPage],
      providers: [
        { provide: CALENDAR_SERVICE, useValue: { connectGoogle } },
        { provide: Router, useValue: { navigate } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(query) } },
        },
      ],
    }).compileComponents();
    TestBed.createComponent(GoogleCalendarCallbackPage);
    await settle();
  }

  beforeEach(() => {
    connectGoogle = vi.fn(async () => ({}));
    navigate = vi.fn(async () => true);
  });

  it('connects with the code and state, then returns to Family', async () => {
    await land({ code: 'c', state: 's' });
    expect(connectGoogle).toHaveBeenCalledWith('c', 's');
    expect(navigate).toHaveBeenCalledWith(['/family'], { queryParams: {}, replaceUrl: true });
  });

  it('returns with the note and never connects when consent was denied', async () => {
    await land({ error: 'access_denied', state: 's' });
    expect(connectGoogle).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/family'], {
      queryParams: { calendar: 'denied' },
      replaceUrl: true,
    });
  });

  it('returns with the note when the API refuses the code', async () => {
    connectGoogle.mockRejectedValueOnce(new Error('400'));
    await land({ code: 'c', state: 's' });
    expect(navigate).toHaveBeenCalledWith(['/family'], {
      queryParams: { calendar: 'denied' },
      replaceUrl: true,
    });
  });
});
