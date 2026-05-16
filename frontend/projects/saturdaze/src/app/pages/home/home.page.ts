import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { WeekendPlanService } from 'api';
import {
  Anticipate,
  BottomNav,
  Button,
  Chip,
  DayCard,
  Hero,
  Icon,
  IconButton,
  ListItem,
  Section,
  SplitView,
  TimelineBlock,
  TopBar,
  WeatherDay,
  WeatherStrip,
} from 'components';

/**
 * Home — "This Weekend".
 *
 * Composes the master + detail panes from the weekend overview signal. The
 * detail pane is shown by the split-view on desktop only; the same data
 * fuels both, mirroring `docs/mocks/pages/home.html`.
 */

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    Anticipate,
    BottomNav,
    Button,
    Chip,
    DayCard,
    Hero,
    Icon,
    IconButton,
    ListItem,
    Section,
    SplitView,
    TimelineBlock,
    TopBar,
    WeatherDay,
    WeatherStrip,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly overview = inject(WeekendPlanService).getDemoOverview();
}
