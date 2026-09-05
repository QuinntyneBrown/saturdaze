import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DayView, SHARED_WEEKEND_SERVICE, WeekendView } from 'api';
import {
  Banner,
  Block,
  Button,
  Chip,
  Day,
  DayWeather,
  Empty,
  Icon,
  PageHeader,
  SkeletonRow,
} from 'components';

import { chipTone } from '../../shared/chip-tones';

type SharedState = 'loading' | 'ready' | 'missing';

const DAY_WEATHER: readonly DayWeather[] = ['sun', 'cloud', 'rain', 'snow'];

/**
 * A shared weekend — `/sample-weekend?share=<token>` (the URL the API
 * builds). Read-only days with no actions, under the site bar so a visitor
 * can create their own account. No token → the landing page.
 */
@Component({
  selector: 'app-shared-weekend',
  standalone: true,
  imports: [Banner, Block, Button, Chip, Day, Empty, Icon, PageHeader, SkeletonRow],
  templateUrl: './shared-weekend.page.html',
  styleUrl: './shared-weekend.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedWeekendPage {
  private readonly shared = inject(SHARED_WEEKEND_SERVICE);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly state = signal<SharedState>('loading');
  protected readonly weekend = signal<WeekendView | null>(null);
  protected readonly days = ['Saturday', 'Sunday'] as const;
  protected readonly skeleton = [0, 1, 2, 3] as const;
  protected readonly chipTone = chipTone;

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('share');
    if (!token) {
      void this.router.navigateByUrl('/');
      return;
    }
    void this.load(token);
  }

  protected dayWeather(day: DayView): DayWeather {
    const icon = day.weather.icon as DayWeather;
    return DAY_WEATHER.includes(icon) ? icon : 'cloud';
  }

  private async load(token: string): Promise<void> {
    try {
      const weekend = await this.shared.load(token);
      this.weekend.set(weekend);
      this.state.set(weekend.status === 'ready' ? 'ready' : 'missing');
    } catch (err) {
      console.error('SharedWeekendPage.load failed', err);
      this.state.set('missing');
    }
  }
}
